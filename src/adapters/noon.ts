import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class NoonAdapter extends BaseAdapter {
  readonly name = 'Noon Egypt';
  readonly baseUrl = 'https://www.noon.com/egypt-en';
  private readonly apiBaseUrl = 'https://www.noon.com/_svc/catalog/api/v3/u/search';

  private hitCache: Map<string, any> = new Map();

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
          const hitUrl = hit.url || hit.product_url;
          let productUrl: string | null = null;

          if (hitUrl && sku) {
            const cleanSlug = hitUrl.replace(/^\//, '').replace(/\/p\/?$/, '').replace(new RegExp(`/${sku}$`), '');
            productUrl = `https://www.noon.com/egypt-en/${cleanSlug}/${sku}/p/`;
          } else if (sku) {
            productUrl = `https://www.noon.com/egypt-en/p/?o=${sku}`;
          }

          if (productUrl) {
            this.hitCache.set(productUrl, hit);
            if (sku) this.hitCache.set(sku, hit);
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
    const skuMatch = url.match(/\/([A-Z0-9]{10,})\/p/i) || url.match(/o=([A-Z0-9]{10,})/i);
    const externalId = skuMatch ? skuMatch[1] : null;
    const cachedHit = url ? this.hitCache.get(url) || (externalId ? this.hitCache.get(externalId) : null) : null;

    // Use fast 5000ms timeout for Noon HTML fetch to prevent hanging on ECONNABORTED tarpits
    const html = await this.httpClient.fetch(url, { timeout: 5000, skipRobots: true });

    if (!html && cachedHit) {
      const price = cachedHit.sale_price || cachedHit.price || null;
      const images: string[] = [];
      if (cachedHit.image_key) {
        images.push(`https://f.nooncdn.com/p/${cachedHit.image_key}.jpg`);
      }

      if (cachedHit.name && price && price > 0) {
        logger.info(`    [Noon] Using catalog API metadata fallback for ${url}`);
        return {
          externalId: externalId || cachedHit.sku || `noon-${Date.now()}`,
          marketplace: this.name,
          productUrl: url,
          name: cachedHit.name,
          brand: cachedHit.brand || null,
          description: cachedHit.name,
          sku: cachedHit.sku || externalId || '',
          currentPrice: price,
          originalPrice: cachedHit.price || price,
          currency: 'EGP',
          images,
          inStock: true,
          ratingAverage: cachedHit.rating ? parseFloat(cachedHit.rating) : null,
          ratingReviews: cachedHit.rating_count ? parseInt(cachedHit.rating_count, 10) : null,
          specifications: {},
        };
      }
    }

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

    // Try Schema.org JSON-LD first (Noon standard hydration)
    let jsonLd: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || '{}');
        if (parsed['@type'] === 'Product') {
          jsonLd = parsed;
        }
      } catch (e) {}
    });

    const productId = externalId || (jsonLd?.sku || `noon-${Date.now()}`);

    if (jsonLd) {
      const priceVal = jsonLd.offers?.price || jsonLd.offers?.[0]?.price || jsonLd.offers?.lowPrice;
      let price = priceVal ? parseFloat(priceVal) : null;
      if (!price || price === 0) {
        const domPrice = $('[data-qa="product-price"], .priceNow, span[class*="price"]').first().text().replace(/[^0-9.]/g, '');
        if (domPrice) price = parseFloat(domPrice);
      }
      if ((!price || price === 0) && cachedHit) {
        price = cachedHit.sale_price || cachedHit.price || null;
      }

      const rawImages = Array.isArray(jsonLd.image) ? jsonLd.image : (jsonLd.image ? [jsonLd.image] : []);
      let images = rawImages.filter((img: string) => typeof img === 'string' && img.startsWith('http') && !img.includes('placeholder'));
      if (images.length === 0 && cachedHit?.image_key) {
        images = [`https://f.nooncdn.com/p/${cachedHit.image_key}.jpg`];
      }

      if (Array.isArray(jsonLd.additionalProperty)) {
        for (const prop of jsonLd.additionalProperty) {
          if (prop.name && prop.value !== undefined) {
            specifications[prop.name] = String(prop.value);
          }
        }
      }

      if (jsonLd.name && price && price > 0 && images.length > 0) {
        return {
          externalId: productId,
          marketplace: this.name,
          productUrl: url,
          name: jsonLd.name,
          brand: jsonLd.brand?.name || jsonLd.brand || cachedHit?.brand || null,
          description: (jsonLd.description || overviewDesc || jsonLd.name).trim(),
          sku: productId,
          currentPrice: price,
          originalPrice: price,
          currency: jsonLd.offers?.priceCurrency || 'EGP',
          images,
          inStock: jsonLd.offers?.availability ? jsonLd.offers.availability.includes('InStock') : true,
          ratingAverage: jsonLd.aggregateRating?.ratingValue ? parseFloat(jsonLd.aggregateRating.ratingValue) : null,
          ratingReviews: jsonLd.aggregateRating?.reviewCount ? parseInt(jsonLd.aggregateRating.reviewCount, 10) : null,
          specifications,
        };
      }
    }

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

          const rawPrice = skuData.price || skuData.sale_price || skuData.offer?.price || skuData.offers?.[0]?.price;
          let price = rawPrice ? parseFloat(rawPrice) : null;
          if (!price && nextDataScript) {
            const priceMatch = nextDataScript.match(/"price"\s*:\s*([0-9.]+)/i) ||
                               nextDataScript.match(/"offer_price"\s*:\s*([0-9.]+)/i) ||
                               nextDataScript.match(/"price_gross"\s*:\s*([0-9.]+)/i);
            if (priceMatch) price = parseFloat(priceMatch[1]);
          }
          if (!price) {
            const domPrice = $('[data-qa="product-price"], .priceNow, [class*="price"]').first().text().replace(/[^0-9.]/g, '');
            if (domPrice) price = parseFloat(domPrice);
          }

          const wasPrice = skuData.was_price ? parseFloat(skuData.was_price) : price;

          // Images — parse image keys and CDN URLs
          const images: string[] = [];
          const rawImgList = skuData.images || skuData.image_keys || skuData.images_keys || [];
          if (Array.isArray(rawImgList)) {
            for (const img of rawImgList) {
              let imgUrl: string | null = null;
              if (typeof img === 'string') {
                imgUrl = img.startsWith('http') ? img : `https://f.nooncdn.com/p/${img}.jpg`;
              } else if (img && typeof img === 'object' && img.url) {
                imgUrl = img.url.startsWith('http') ? img.url : `https://f.nooncdn.com/p/${img.url}.jpg`;
              }
              if (imgUrl && !imgUrl.includes('placeholder') && !images.includes(imgUrl)) {
                images.push(imgUrl);
              }
            }
          }

          if (images.length === 0 && nextDataScript) {
            const imgMatches = nextDataScript.match(/([N|Z][0-9a-zA-Z_\-]+\.jpg)/g);
            if (imgMatches) {
              for (const m of imgMatches) {
                const imgUrl = `https://f.nooncdn.com/p/${m}`;
                if (!images.includes(imgUrl)) images.push(imgUrl);
              }
            }
          }

          // DOM Image fallback
          if (images.length === 0) {
            $('img[src*="nooncdn.com/p/"]').each((_, el) => {
              const src = $(el).attr('src');
              if (src && src.startsWith('http') && !src.includes('placeholder') && !images.includes(src)) {
                images.push(src);
              }
            });
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

    const domSkuMatch = url.match(/\/p\/([^/?]+)/);
    const domExternalId = domSkuMatch ? domSkuMatch[1] : `noon-${Date.now()}`;

    const priceText = $('.priceNow, [class*="price"]').first().text().replace(/[^0-9.]/g, '');
    const currentPrice = priceText ? parseFloat(priceText) : null;

    return {
      externalId: domExternalId,
      marketplace: this.name,
      productUrl: url,
      name: title,
      brand: null,
      description: (title + ' ' + overviewDesc).trim(),
      sku: domExternalId,
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
