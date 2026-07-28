import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class AmazonAdapter extends BaseAdapter {
  readonly name = 'Amazon Egypt';
  readonly baseUrl = 'https://www.amazon.eg';

  async discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult> {
    const searchTerm = searchTerms[currentSearchTermIndex] || searchTerms[0];
    const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(searchTerm)}&page=${page}`;

    logger.info(`    [Amazon] Discovering "${searchTerm}" page ${page}`);
    const html = await this.httpClient.fetch(searchUrl);

    if (!html) {
      return { candidateUrls: [], hasNextPage: false, searchTermUsed: searchTerm };
    }

    const $ = cheerio.load(html);
    const candidateUrls: string[] = [];

    $('[data-component-type="s-search-result"], div.s-result-item[data-asin]').each((_, el) => {
      const asin = $(el).attr('data-asin');
      if (asin && asin.length === 10) {
        const fullUrl = `${this.baseUrl}/dp/${asin}`;
        if (!candidateUrls.includes(fullUrl)) {
          candidateUrls.push(fullUrl);
        }
      }
    });

    const hasNextPage = candidateUrls.length > 0 && page < 20;

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
    const title = $('#productTitle').text().trim() || $('meta[name="title"]').attr('content') || '';
    if (!title) return null;

    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    const externalId = asinMatch ? asinMatch[1] : `amz-${Date.now()}`;

    // Price extraction — no fabrication
    const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
    const currentPrice = priceWhole ? parseFloat(priceWhole) : null;
    const strikePrice = $('.a-text-price .a-offscreen').first().text().replace(/[^0-9.]/g, '');
    const originalPrice = strikePrice ? parseFloat(strikePrice) : currentPrice;

    // Brand extraction
    const brand = $('#bylineInfo').text().replace(/^Brand:\s*/i, '').replace(/^الماركة:\s*/i, '').trim() || null;

    const description = $('#feature-bullets').text().replace(/\s+/g, ' ').trim() || null;

    // Specifications
    const specifications: Record<string, string> = {};

    $('.po-break-word, .a-size-base.po-break-word').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.includes('العمق') || text.includes('العرض') || text.includes('الارتفاع') || text.includes('cm') || text.includes('سم')) {
        specifications[`po_dim_${_}`] = text;
      }
    });

    $('#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr').each((_, el) => {
      const key = $(el).find('th').text().trim();
      const val = $(el).find('td').text().trim();
      if (key && val) specifications[key] = val;
    });

    $('#detailBullets_feature_div li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const parts = text.split(':');
      if (parts.length >= 2) {
        specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    // Images — no placeholders
    const images: string[] = [];
    $('#imgTagWrapperId img, #landingImage, #altImages img').each((_, el) => {
      const dynImg = $(el).attr('data-a-dynamic-image');
      if (dynImg) {
        try {
          const parsed = JSON.parse(dynImg);
          Object.keys(parsed).forEach((k) => {
            if (k.startsWith('http') && !images.includes(k)) images.push(k);
          });
        } catch (e) {
          // fallback
        }
      }
      const src = $(el).attr('src') || $(el).attr('data-old-hires');
      if (src && src.startsWith('http') && !images.includes(src)) {
        images.push(src);
      }
    });

    // Rating — only use real data
    const ratingText = $('span[data-hook="rating-out-of-text"], #acrPopover .a-icon-alt').first().text();
    const ratingMatch = ratingText.match(/([\d.]+)/);
    const ratingAverage = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const reviewsText = $('#acrCustomerReviewText').first().text();
    const reviewsMatch = reviewsText.match(/([\d,]+)/);
    const ratingReviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g, ''), 10) : null;

    // Stock
    const availabilityText = $('#availability').text().toLowerCase();
    const inStock = !availabilityText.includes('unavailable') && !availabilityText.includes('غير متوفر');

    return {
      externalId,
      marketplace: this.name,
      productUrl: url,
      name: title,
      brand,
      description,
      sku: externalId,
      currentPrice,
      originalPrice,
      currency: 'EGP',
      images,
      inStock,
      ratingAverage,
      ratingReviews,
      specifications,
    };
  }
}
