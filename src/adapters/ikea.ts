import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class IkeaAdapter extends BaseAdapter {
  readonly name = 'IKEA Egypt';
  readonly baseUrl = 'https://www.ikea.com/eg/ar';
  private hitCache: Map<string, any> = new Map();

  async discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult> {
    const searchTerm = searchTerms[currentSearchTermIndex] || searchTerms[0];
    const pageSize = 24;
    const apiUrl = `https://sik.search.blue.cdtapps.com/eg/ar/search-result-page?q=${encodeURIComponent(searchTerm)}&size=${pageSize}`;

    logger.info(`    [IKEA] Discovering "${searchTerm}" page ${page} (API)`);

    const candidateUrls: string[] = [];
    let hasNextPage = false;

    try {
      const response = await this.httpClient.fetch(apiUrl, { skipRobots: true });
      if (response) {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        const items = data?.searchResultPage?.products?.main?.items || [];
        const totalHits = data?.searchResultPage?.products?.main?.productCount || 0;

        for (const item of items) {
          const product = item?.product;
          if (product) {
            const pipUrl = product.pipUrl;
            if (pipUrl && pipUrl.startsWith('http')) {
              this.hitCache.set(pipUrl, product);
              if (product.itemNo) this.hitCache.set(product.itemNo, product);
              if (!candidateUrls.includes(pipUrl)) {
                candidateUrls.push(pipUrl);
              }
            }
          }
        }

        hasNextPage = candidateUrls.length >= pageSize && page < 10;
      }
    } catch (err: any) {
      logger.warn(`    [IKEA] Discovery API error: ${err.message}`);
    }

    return {
      candidateUrls,
      hasNextPage,
      searchTermUsed: searchTerm,
    };
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    const itemNoMatch = url.match(/([s]?\d{8})/i) || url.match(/-(\d{8})\/?/);
    const itemNo = itemNoMatch ? itemNoMatch[1] : null;
    const cached = this.hitCache.get(url) || (itemNo ? this.hitCache.get(itemNo) : null);

    const html = await this.httpClient.fetch(url, { skipRobots: true });

    if (!html && cached) {
      const name = `${cached.name || ''} - ${cached.typeName || ''}`.replace(/^[\s-]+|[\s-]+$/g, '');
      const price = cached.salesPrice?.numeral || cached.price?.numeral || null;
      const images = cached.mainImageUrl ? [cached.mainImageUrl] : [];

      if (name && price && price > 0) {
        logger.info(`    [IKEA] Using API metadata fallback for ${url}`);
        return {
          externalId: cached.itemNo || `ikea-${Date.now()}`,
          marketplace: this.name,
          productUrl: url,
          name,
          brand: 'IKEA',
          description: cached.description || name,
          sku: cached.itemNo || '',
          currentPrice: price,
          originalPrice: price,
          currency: 'EGP',
          images,
          inStock: true,
          ratingAverage: cached.ratingValue ? parseFloat(cached.ratingValue) : null,
          ratingReviews: cached.ratingCount ? parseInt(cached.ratingCount, 10) : null,
          specifications: {},
        };
      }
    }

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
