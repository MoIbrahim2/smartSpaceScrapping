import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class NoonAdapter extends BaseAdapter {
  readonly name = 'Noon Egypt';
  readonly baseUrl = 'https://www.noon.com/egypt-en';
  private readonly apiBaseUrl = 'https://www.noon.com/_svc/catalog/api/v3/u/search';

  async discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult> {
    const searchTerm = searchTerms[currentSearchTermIndex] || searchTerms[0];

    // Use Noon's catalog API for reliable discovery
    const apiUrl = `${this.apiBaseUrl}?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=40&sort%5Bby%5D=relevance&sort%5Bdir%5D=desc&f%5Bcountry%5D=eg&locale=en`;

    logger.info(`    [Noon] Discovering "${searchTerm}" page ${page} (API)`);

    const candidateUrls: string[] = [];
    let hasNextPage = false;

    try {
      const response = await this.httpClient.fetch(apiUrl);
      if (response) {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        const hits = data?.hits || data?.results || [];

        for (const hit of hits) {
          const sku = hit.sku || hit.product_sku || hit.id;
          if (sku) {
            const productUrl = `https://www.noon.com/egypt-en/p/${sku}`;
            if (!candidateUrls.includes(productUrl)) {
              candidateUrls.push(productUrl);
            }
          }
        }

        const totalPages = data?.nbPages || data?.total_pages || 0;
        hasNextPage = candidateUrls.length > 0 && page < totalPages && page < 20;
      }
    } catch (apiError: any) {
      logger.info(`    [Noon] API failed (${apiError.message}). Falling back to HTML search.`);

      // Fallback: HTML search page
      const searchUrl = `${this.baseUrl}/search/?q=${encodeURIComponent(searchTerm)}&page=${page}`;
      const html = await this.httpClient.fetch(searchUrl);

      if (html) {
        const $ = cheerio.load(html);

        // Try __NEXT_DATA__
        const nextDataScript = $('#__NEXT_DATA__').html();
        if (nextDataScript) {
          try {
            const jsonData = JSON.parse(nextDataScript);
            const grid = jsonData?.props?.pageProps?.catalog?.grid ||
                         jsonData?.props?.pageProps?.initialData?.catalog?.grid || [];
            for (const item of grid) {
              const itemUrl = item.url;
              if (itemUrl) {
                const fullUrl = itemUrl.startsWith('http')
                  ? itemUrl
                  : `https://www.noon.com/egypt-en/${itemUrl.replace(/^\//, '')}`;
                if (!candidateUrls.includes(fullUrl) && fullUrl.includes('/p/')) {
                  candidateUrls.push(fullUrl);
                }
              }
            }
          } catch (e) {
            logger.debug('[Noon] Failed parsing __NEXT_DATA__ JSON');
          }
        }

        // DOM fallback
        $('a[href*="/p/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/p/')) {
            const fullUrl = href.startsWith('http') ? href : `https://www.noon.com${href}`;
            if (!candidateUrls.includes(fullUrl)) {
              candidateUrls.push(fullUrl);
            }
          }
        });

        hasNextPage = candidateUrls.length > 0 && page < 20;
      }
    }

    return {
      candidateUrls,
      hasNextPage,
      searchTermUsed: searchTerm,
    };
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    const html = await this.httpClient.fetch(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    const specifications: Record<string, string> = {};

    // Parse spec tables
    $('tr').each((_, el) => {
      const keyTd = $(el).find('td[class*="_specName_"], td:nth-child(1), .specKey');
      const valTd = $(el).find('td[class*="_specValue_"], td:nth-child(2), .specValue');
      if (keyTd.length && valTd.length) {
        const k = keyTd.text().trim();
        const v = valTd.text().trim();
        if (k && v) specifications[k] = v;
      }
    });

    const overviewDesc = $('div[class*="_overviewDesc_"] p, div[class*="_overviewDescriptionWrapper_"]')
      .text().replace(/\s+/g, ' ').trim();

    // Try __NEXT_DATA__ for structured product data
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
          } else if (typeof skuData.specifications === 'object' && skuData.specifications) {
            Object.assign(specifications, skuData.specifications);
          }

          const price = skuData.price ? parseFloat(skuData.price) : null;
          const wasPrice = skuData.was_price ? parseFloat(skuData.was_price) : price;

          // Images — only use real URLs
          const images: string[] = [];
          if (skuData.images && Array.isArray(skuData.images)) {
            for (const img of skuData.images) {
              const imgUrl = typeof img === 'string'
                ? (img.startsWith('http') ? img : `https://f.nooncdn.com/p/${img}`)
                : null;
              if (imgUrl && !imgUrl.includes('placeholder')) {
                images.push(imgUrl);
              }
            }
          }

          const productName = skuData.name || '';
          if (!productName) return null;

          return {
            externalId: skuData.sku || `noon-${Date.now()}`,
            marketplace: this.name,
            productUrl: url,
            name: productName,
            brand: skuData.brand || null,
            description: ((skuData.description || '') + ' ' + overviewDesc).trim() || null,
            sku: skuData.sku || '',
            currentPrice: price,
            originalPrice: wasPrice,
            currency: 'EGP',
            images,
            inStock: skuData.is_in_stock ?? null,
            ratingAverage: skuData.rating?.average ?? null,
            ratingReviews: skuData.rating?.count ?? null,
            specifications,
          };
        }
      } catch (e) {
        logger.debug('[Noon] Failed parsing __NEXT_DATA__ product details');
      }
    }

    // DOM fallback
    const title = $('h1').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    if (!title) return null;

    const skuMatch = url.match(/\/p\/([^/?]+)/);
    const externalId = skuMatch ? skuMatch[1] : `noon-${Date.now()}`;

    const priceText = $('.priceNow, [class*="price"]').first().text().replace(/[^0-9.]/g, '');
    const currentPrice = priceText ? parseFloat(priceText) : null;

    return {
      externalId,
      marketplace: this.name,
      productUrl: url,
      name: title,
      brand: null,
      description: (title + ' ' + overviewDesc).trim(),
      sku: externalId,
      currentPrice,
      originalPrice: currentPrice,
      currency: 'EGP',
      images: [],
      inStock: null,
      ratingAverage: null,
      ratingReviews: null,
      specifications,
    };
  }
}
