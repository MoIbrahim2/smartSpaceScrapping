import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class IkeaAdapter extends BaseAdapter {
  readonly name = 'IKEA Egypt';
  readonly baseUrl = 'https://www.ikea.com/eg/ar';
  private readonly searchApiUrl = 'https://sik.search.blue.cdtapps.com/eg/ar/search-result-page';

  async discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult> {
    const searchTerm = searchTerms[currentSearchTermIndex] || searchTerms[0];
    const pageSize = 24;
    const offset = (page - 1) * pageSize;

    // Use IKEA's search API for reliable discovery
    const apiUrl = `${this.searchApiUrl}?q=${encodeURIComponent(searchTerm)}&size=${pageSize}&types=PRODUCT&subcategories-style=tree-navigation&c=sr&v=20250101&sort=RELEVANCE&offset=${offset}`;

    logger.info(`    [IKEA] Discovering "${searchTerm}" page ${page} (API)`);

    const candidateUrls: string[] = [];
    let hasNextPage = false;

    try {
      const response = await this.httpClient.fetch(apiUrl);
      if (response) {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        const items = data?.searchResultPage?.products?.main?.items || [];
        const totalHits = data?.searchResultPage?.products?.main?.productCount || 0;

        for (const item of items) {
          const product = item?.product;
          if (product) {
            const pipUrl = product.pipUrl;
            if (pipUrl && pipUrl.startsWith('http')) {
              if (!candidateUrls.includes(pipUrl)) {
                candidateUrls.push(pipUrl);
              }
            }
          }
        }

        hasNextPage = candidateUrls.length > 0 && (offset + pageSize) < totalHits && page < 10;
      }
    } catch (apiError: any) {
      logger.info(`    [IKEA] API failed (${apiError.message}). Falling back to HTML search.`);

      // Fallback: HTML search
      const searchUrl = `${this.baseUrl}/search/?q=${encodeURIComponent(searchTerm)}`;
      const html = await this.httpClient.fetch(searchUrl);

      if (html) {
        const $ = cheerio.load(html);
        const seen = new Set<string>();

        $('a[href*="/p/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `https://www.ikea.com${href}`;
            if (!seen.has(fullUrl)) {
              seen.add(fullUrl);
              candidateUrls.push(fullUrl);
            }
          }
        });

        hasNextPage = false; // HTML search doesn't paginate reliably
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

    // Measurements extraction
    $('.pipf-measurements-modal__measurements-container li, .pipf-measurements-modal__product-measurement-wrapper, .pip-product-dimensions__measurement-container li, #pip-product-measurements p').each((_, el) => {
      const name = $(el).find('.pipf-measurements-modal__product-measurement-name, .pip-product-dimensions__measurement-name').text().replace(/[:\s\u00a0]+$/, '').trim();
      const val = $(el).text().replace(name, '').replace(/[:\s\u00a0]+/, '').trim();
      if (name && val) {
        specifications[name] = val;
      } else {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const parts = text.split(':');
        if (parts.length >= 2) {
          specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      }
    });

    // Try JSON-LD structured data
    let jsonLdProduct: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type'] === 'Product') {
          jsonLdProduct = json;
        }
      } catch (e) {
        // ignore
      }
    });

    if (jsonLdProduct) {
      if (jsonLdProduct.weight) specifications['Weight'] = `${jsonLdProduct.weight.value || jsonLdProduct.weight} ${jsonLdProduct.weight.unitCode || 'kg'}`;
      if (jsonLdProduct.width) specifications['Width'] = `${jsonLdProduct.width.value || jsonLdProduct.width} cm`;
      if (jsonLdProduct.height) specifications['Height'] = `${jsonLdProduct.height.value || jsonLdProduct.height} cm`;
      if (jsonLdProduct.depth) specifications['Depth'] = `${jsonLdProduct.depth.value || jsonLdProduct.depth} cm`;

      // Images
      const extractedImages: string[] = [];
      const rawImgs = Array.isArray(jsonLdProduct.image) ? jsonLdProduct.image : [jsonLdProduct.image];
      for (const img of rawImgs) {
        if (typeof img === 'string' && img.startsWith('http') && !img.includes('placeholder')) {
          extractedImages.push(img);
        } else if (img && typeof img === 'object') {
          const urlStr = img.contentUrl || img.url || img.src;
          if (typeof urlStr === 'string' && urlStr.startsWith('http') && !urlStr.includes('placeholder')) {
            extractedImages.push(urlStr);
          }
        }
      }

      const price = jsonLdProduct.offers?.price || jsonLdProduct.offers?.[0]?.price;
      const parsedPrice = price ? parseFloat(price) : null;

      // Availability from JSON-LD
      const availability = jsonLdProduct.offers?.availability || '';
      const inStock = availability ? availability.includes('InStock') : null;

      // Rating from JSON-LD
      const aggregateRating = jsonLdProduct.aggregateRating;
      const ratingAverage = aggregateRating?.ratingValue ? parseFloat(aggregateRating.ratingValue) : null;
      const ratingReviews = aggregateRating?.reviewCount ? parseInt(aggregateRating.reviewCount, 10) : null;

      const productName = jsonLdProduct.name
        ? `${jsonLdProduct.name}${jsonLdProduct.description ? ' - ' + jsonLdProduct.description : ''}`
        : '';
      if (!productName) return null;

      return {
        externalId: jsonLdProduct.sku || `ikea-${Date.now()}`,
        marketplace: this.name,
        productUrl: url,
        name: productName,
        brand: 'IKEA',
        description: jsonLdProduct.description || null,
        sku: jsonLdProduct.sku || '',
        currentPrice: parsedPrice,
        originalPrice: parsedPrice,
        currency: 'EGP',
        images: extractedImages,
        inStock,
        ratingAverage,
        ratingReviews,
        specifications,
      };
    }

    // DOM fallback
    const title = $('.pip-header-section__title-text').text().trim() || $('h1').text().trim();
    if (!title) return null;

    const articleNo = url.match(/-s?(\d{8})\//) || url.match(/\/art-(\d{8})/);
    const externalId = articleNo ? articleNo[1] : `ikea-${Date.now()}`;

    const priceVal = $('.pip-temp-price__integer').text().replace(/[^0-9]/g, '');
    const currentPrice = priceVal ? parseFloat(priceVal) : null;

    return {
      externalId,
      marketplace: this.name,
      productUrl: url,
      name: title,
      brand: 'IKEA',
      description: title,
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
