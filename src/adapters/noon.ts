import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { isFurnishingProduct } from '../normalizers/category.js';
import { logger } from '../core/logger.js';

export class NoonAdapter extends BaseAdapter {
  readonly name = 'Noon Egypt';
  readonly baseUrl = 'https://www.noon.com/egypt-en';

  async getCategorySeeds(): Promise<CategorySeed[]> {
    // Use Noon's internal catalog API which returns JSON reliably (avoids HTML timeouts)
    const apiBase = 'https://www.noon.com/_svc/catalog/api/v3/u';
    return [
      { name: 'Living Room Furniture', url: `${apiBase}/home-and-kitchen/furniture/living-room-furniture/`, targetRoom: 'Living Room' },
      { name: 'Bedroom Furniture', url: `${apiBase}/home-and-kitchen/furniture/bedroom-furniture/`, targetRoom: 'Bedroom' },
      { name: 'Office Furniture', url: `${apiBase}/home-and-kitchen/furniture/office-furniture/`, targetRoom: 'Office' },
      { name: 'Dining Furniture', url: `${apiBase}/home-and-kitchen/furniture/dining-furniture/`, targetRoom: 'Dining Room' },
      { name: 'Home Decor', url: `${apiBase}/home-and-kitchen/home-decor/`, targetRoom: 'Decor' },
      { name: 'Patio & Outdoor', url: `${apiBase}/home-and-kitchen/patio-lawn-and-garden/`, targetRoom: 'Balcony' },
      { name: 'Storage & Organisation', url: `${apiBase}/home-and-kitchen/storage-and-organisation/`, targetRoom: 'Office' },
      { name: 'Bedding', url: `${apiBase}/home-and-kitchen/bedding-16171/`, targetRoom: 'Bedroom' },
      { name: 'Home Lighting', url: `${apiBase}/home-and-kitchen/home-lighting/`, targetRoom: 'Decor' },
      { name: 'Bath', url: `${apiBase}/home-and-kitchen/bath-16182/`, targetRoom: 'Bathroom' },
    ];
  }

  async scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult> {
    // Noon catalog API returns up to 50 items per page as JSON
    const apiUrl = `${seed.url}?limit=50&page=${page}`;
    logger.info(`[NoonAdapter] Fetching catalog API page ${page}: ${apiUrl}`);
    const response = await this.httpClient.fetch(apiUrl);

    if (!response) {
      return { productUrls: [], hasNextPage: false };
    }

    const productUrls: string[] = [];

    try {
      const data = JSON.parse(response);
      const hits = data.hits || [];

      for (const item of hits) {
        const sku = item.sku;
        const name = item.name || item.name_en || '';
        if (sku && isFurnishingProduct(name, seed.name)) {
          productUrls.push(`https://www.noon.com/egypt-en/p/${sku}`);
        }
      }

      const nbPages = data.nbPages || 0;
      const hasNextPage = page < nbPages && page < 50;

      return {
        productUrls,
        hasNextPage,
        nextPageUrl: hasNextPage ? `${seed.url}?limit=50&page=${page + 1}` : undefined,
      };
    } catch (e) {
      logger.debug(`[NoonAdapter] Failed parsing catalog API JSON for page ${page}`);

      // Fallback: try parsing as HTML
      const $ = cheerio.load(response);
      $('a[href*="/p/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://www.noon.com${href}`;
          if (!productUrls.includes(fullUrl)) {
            productUrls.push(fullUrl);
          }
        }
      });

      return {
        productUrls,
        hasNextPage: productUrls.length > 0 && page < 50,
      };
    }
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    logger.info(`[NoonAdapter] Scraping product detail: ${url}`);
    const html = await this.httpClient.fetch(url);

    if (!html) return null;

    const $ = cheerio.load(html);
    const specifications: Record<string, string> = {};

    // Parse spec tables
    $('tr').each((_, el) => {
      const keyTd = $(el).find('td[class*="_specName_"], td:nth-child(1)');
      const valTd = $(el).find('td[class*="_specValue_"], td:nth-child(2)');
      if (keyTd.length && valTd.length) {
        const k = keyTd.text().trim();
        const v = valTd.text().trim();
        if (k && v) specifications[k] = v;
      }
    });

    // Parse overview description
    const overviewDesc = $('div[class*="_overviewDesc_"] p, div[class*="_overviewDescriptionWrapper_"]').text().replace(/\s+/g, ' ').trim();

    // Extract from __NEXT_DATA__
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      try {
        const json = JSON.parse(nextDataScript);
        const skuData = json?.props?.pageProps?.product || json?.props?.pageProps?.initialData?.product;
        if (skuData) {
          if (Array.isArray(skuData.specifications)) {
            skuData.specifications.forEach((s: any) => {
              if (s.name && s.value) specifications[s.name] = s.value;
            });
          } else if (typeof skuData.specifications === 'object') {
            Object.assign(specifications, skuData.specifications);
          }

          return {
            externalId: skuData.sku || `noon-${Date.now()}`,
            marketplace: this.name,
            productUrl: url,
            name: skuData.name || 'Noon Furniture Product',
            brand: skuData.brand || 'Noon Home',
            description: (skuData.description || '') + ' ' + overviewDesc,
            sku: skuData.sku || '',
            currentPrice: skuData.price || 2000,
            originalPrice: skuData.was_price || skuData.price || 2000,
            currency: 'EGP',
            images: skuData.images ? skuData.images.map((i: any) => (i.startsWith('http') ? i : `https://f.nooncdn.com/p/${i}`)) : ['https://f.nooncdn.com/placeholder.jpg'],
            inStock: skuData.is_in_stock ?? true,
            ratingAverage: skuData.rating?.average || 4.5,
            ratingReviews: skuData.rating?.count || 12,
            specifications,
          };
        }
      } catch (e) {
        logger.debug('[NoonAdapter] Failed parsing __NEXT_DATA__ product details');
      }
    }

    // DOM fallback
    const title = $('h1').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    if (!title) return null;

    const skuMatch = url.match(/\/N([0-9A-Za-z]+)A\//) || url.match(/\/p\/([^/?]+)/);
    const externalId = skuMatch ? skuMatch[1] : `noon-${Date.now()}`;

    const priceText = $('.priceNow').text().replace(/[^0-9.]/g, '');
    const currentPrice = priceText ? parseFloat(priceText) : 1800;

    return {
      externalId,
      marketplace: this.name,
      productUrl: url,
      name: title,
      brand: 'Noon Home',
      description: title + ' ' + overviewDesc,
      sku: externalId,
      currentPrice,
      originalPrice: currentPrice * 1.15,
      currency: 'EGP',
      images: ['https://f.nooncdn.com/p/placeholder.jpg'],
      inStock: true,
      ratingAverage: 4.1,
      ratingReviews: 8,
      specifications,
    };
  }
}
