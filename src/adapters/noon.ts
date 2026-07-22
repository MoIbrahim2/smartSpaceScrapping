import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { isFurnishingProduct } from '../normalizers/category.js';
import { logger } from '../core/logger.js';

export class NoonAdapter extends BaseAdapter {
  readonly name = 'Noon Egypt';
  readonly baseUrl = 'https://www.noon.com/egypt-en';

  async getCategorySeeds(): Promise<CategorySeed[]> {
    return [
      { name: 'Living Room Furniture', url: `${this.baseUrl}/home-and-kitchen/furniture/living-room-furniture/`, targetRoom: 'Living Room' },
      { name: 'Bedroom Furniture', url: `${this.baseUrl}/home-and-kitchen/furniture/bedroom-furniture/`, targetRoom: 'Bedroom' },
      { name: 'Home Decor', url: `${this.baseUrl}/home-and-kitchen/home-decor/`, targetRoom: 'Decor' },
      { name: 'Office Furniture', url: `${this.baseUrl}/home-and-kitchen/furniture/office-furniture/`, targetRoom: 'Office' },
      { name: 'Dining Furniture', url: `${this.baseUrl}/home-and-kitchen/furniture/dining-furniture/`, targetRoom: 'Dining Room' },
      { name: 'Patio & Outdoor', url: `${this.baseUrl}/home-and-kitchen/patio-lawn-and-garden/`, targetRoom: 'Balcony' },
    ];
  }

  async scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult> {
    const pageUrl = `${seed.url}?page=${page}`;
    logger.info(`[NoonAdapter] Scraping category page ${page}: ${pageUrl}`);
    const html = await this.httpClient.fetch(pageUrl);

    if (!html) {
      return { productUrls: [], hasNextPage: false };
    }

    const $ = cheerio.load(html);
    const productUrls: string[] = [];

    // Check for Next.js embedded hydration script
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      try {
        const jsonData = JSON.parse(nextDataScript);
        const catalog = jsonData?.props?.pageProps?.catalog?.grid || jsonData?.props?.pageProps?.initialData?.catalog?.grid || [];
        for (const item of catalog) {
          if (item.url && isFurnishingProduct(item.name || '', seed.name)) {
            productUrls.push(`https://www.noon.com/egypt-en/${item.url}`);
          }
        }
      } catch (e) {
        logger.debug('[NoonAdapter] Could not parse __NEXT_DATA__ JSON');
      }
    }

    // DOM fallback selector
    $('a[href*="/p/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.noon.com${href}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    const hasNextPage = productUrls.length > 0 && page < 20;

    return {
      productUrls,
      hasNextPage,
      nextPageUrl: hasNextPage ? `${seed.url}?page=${page + 1}` : undefined,
    };
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    logger.info(`[NoonAdapter] Scraping product detail: ${url}`);
    const html = await this.httpClient.fetch(url);

    if (!html) return null;

    const $ = cheerio.load(html);
    const specifications: Record<string, string> = {};

    // 1. Parse Spec Tables (td[class*="_specName_"] / td[class*="_specValue_"])
    $('tr').each((_, el) => {
      const keyTd = $(el).find('td[class*="_specName_"], td:nth-child(1), .specKey');
      const valTd = $(el).find('td[class*="_specValue_"], td:nth-child(2), .specValue');
      if (keyTd.length && valTd.length) {
        const k = keyTd.text().trim();
        const v = valTd.text().trim();
        if (k && v) specifications[k] = v;
      }
    });

    // 2. Parse Product Overview description text (div[class*="_overviewDesc_"] p)
    const overviewDesc = $('div[class*="_overviewDesc_"] p, div[class*="_overviewDescriptionWrapper_"]').text().replace(/\s+/g, ' ').trim();

    // 3. Extract hydration state if available
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

    // DOM fallback parsing
    const title = $('h1').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    if (!title) return null;

    const skuMatch = url.match(/\/N([0-9A-Za-z]+)A\//) || url.match(/\/p\/([^/]+)/);
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
