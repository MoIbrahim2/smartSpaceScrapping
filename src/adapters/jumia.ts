import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { logger } from '../core/logger.js';

export class JumiaAdapter extends BaseAdapter {
  readonly name = 'Jumia Egypt';
  readonly baseUrl = 'https://www.jumia.com.eg';

  async discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult> {
    const searchTerm = searchTerms[currentSearchTermIndex] || searchTerms[0];
    const searchUrl = `${this.baseUrl}/catalog/?q=${encodeURIComponent(searchTerm)}&page=${page}`;

    logger.info(`    [Jumia] Discovering "${searchTerm}" page ${page}`);
    const html = await this.httpClient.fetch(searchUrl);

    if (!html) {
      return { candidateUrls: [], hasNextPage: false, searchTermUsed: searchTerm };
    }

    const $ = cheerio.load(html);
    const candidateUrls: string[] = [];

    $('article.prd').each((_, el) => {
      const link = $(el).find('a.core').attr('href');
      if (link) {
        const fullUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
        if (!candidateUrls.includes(fullUrl)) {
          candidateUrls.push(fullUrl);
        }
      }
    });

    // Also try generic product links
    if (candidateUrls.length === 0) {
      $('a[href*=".html"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('.html') && !href.includes('/catalog/') && !href.includes('/search/')) {
          const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
          if (!candidateUrls.includes(fullUrl)) {
            candidateUrls.push(fullUrl);
          }
        }
      });
    }

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
    const title = $('h1.-fs20').text().trim() || $('h1').first().text().trim();
    if (!title) return null;

    const skuMatch = url.match(/-([0-9a-zA-Z]+)\.html/);
    const externalId = skuMatch ? skuMatch[1] : `jumia-${Date.now()}`;

    // Price — no fabrication
    const priceText = $('span.-b.-ltr.-i.-e30.-mrxs').text().replace(/[^0-9.]/g, '') ||
                      $('span.-b.-ltr').first().text().replace(/[^0-9.]/g, '');
    const currentPrice = priceText ? parseFloat(priceText) : null;

    const oldPriceText = $('span.-s.-line-thru.-ltr').text().replace(/[^0-9.]/g, '');
    const originalPrice = oldPriceText ? parseFloat(oldPriceText) : currentPrice;

    const brand = $('.-fs14 .-pvxs a').text().trim() || null;
    const description = $('#markup').text().trim() || null;

    // Specifications
    const specifications: Record<string, string> = {};

    $('.-pvs .list.-ndash li, li.-pvxs, #markup li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const label = $(el).find('span.-b').text().trim();
      if (label) {
        const val = text.replace(label, '').replace(/^[:\s]+/, '').trim();
        specifications[label] = val;
      } else {
        const parts = text.split(':');
        if (parts.length >= 2) {
          specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      }
    });

    // Images — no placeholders
    const images: string[] = [];
    $('#imgs img, .-fw.-m.-auto img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && src.startsWith('http') && !images.includes(src) && !src.includes('placeholder')) {
        images.push(src);
      }
    });

    // Rating — real data only
    const ratingText = $('.stars._m._al').text().trim();
    const ratingMatch = ratingText.match(/([\d.]+)/);
    const ratingAverage = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const reviewsText = $('a[href="#reviews"]').text().trim();
    const reviewsMatch = reviewsText.match(/\((\d+)\)/);
    const ratingReviews = reviewsMatch ? parseInt(reviewsMatch[1], 10) : null;

    // Stock
    const outOfStock = $('p.-fs16.-b.-i.-c-r').text().toLowerCase().includes('out of stock') ||
                       $('p.-fs16.-b.-i.-c-r').text().includes('غير متوفر');
    const inStock = !outOfStock;

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
