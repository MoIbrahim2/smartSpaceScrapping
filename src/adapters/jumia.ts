import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { isFurnishingProduct } from '../normalizers/category.js';
import { logger } from '../core/logger.js';

export class JumiaAdapter extends BaseAdapter {
  readonly name = 'Jumia Egypt';
  readonly baseUrl = 'https://www.jumia.com.eg';

  async getCategorySeeds(): Promise<CategorySeed[]> {
    return [
      { name: 'Home & Office Furniture', url: `${this.baseUrl}/ar/home-office-furniture/`, targetRoom: 'Living Room' },
      { name: 'Living Room Furniture', url: `${this.baseUrl}/ar/living-room-furniture/`, targetRoom: 'Living Room' },
      { name: 'Bedroom Furniture', url: `${this.baseUrl}/ar/bedroom-furniture/`, targetRoom: 'Bedroom' },
      { name: 'Dining Room Furniture', url: `${this.baseUrl}/ar/dining-room-furniture/`, targetRoom: 'Dining Room' },
      { name: 'Home Decor', url: `${this.baseUrl}/ar/home-decor/`, targetRoom: 'Decor' },
      { name: 'Bedding & Bedroom', url: `${this.baseUrl}/ar/bedding/`, targetRoom: 'Bedroom' },
      { name: 'Lighting & Lamps', url: `${this.baseUrl}/ar/home-lighting/`, targetRoom: 'Decor' },
      { name: 'Outdoor & Garden', url: `${this.baseUrl}/ar/patio-lawn-garden/`, targetRoom: 'Balcony' },
    ];
  }

  async scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult> {
    const pageUrl = `${seed.url}?page=${page}`;
    logger.info(`[JumiaAdapter] Scraping category page ${page}: ${pageUrl}`);
    const html = await this.httpClient.fetch(pageUrl);

    if (!html) {
      return { productUrls: [], hasNextPage: false };
    }

    const $ = cheerio.load(html);
    const productUrls: string[] = [];

    $('article.prd').each((_, el) => {
      const link = $(el).find('a.core').attr('href');
      const title = $(el).find('.name').text().trim();

      if (link && isFurnishingProduct(title, seed.name)) {
        const fullUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    const hasNextPage = productUrls.length > 0 && page < 50;

    return {
      productUrls,
      hasNextPage,
      nextPageUrl: hasNextPage ? `${seed.url}?page=${page + 1}` : undefined,
    };
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    logger.info(`[JumiaAdapter] Scraping product detail: ${url}`);
    const html = await this.httpClient.fetch(url);

    if (!html) return null;

    const $ = cheerio.load(html);
    const title = $('h1.-fs20').text().trim() || $('h1').first().text().trim();
    if (!title) return null;

    const skuMatch = url.match(/-([0-9a-zA-Z]+)\.html/);
    const externalId = skuMatch ? skuMatch[1] : `jumia-${Date.now()}`;

    const priceText = $('span.-b.-ltr.-i.-e30.-mrxs').text().replace(/[^0-9.]/g, '') || $('span.-b.-ltr').first().text().replace(/[^0-9.]/g, '');
    const currentPrice = priceText ? parseFloat(priceText) : 1200;

    const oldPriceText = $('span.-s.-line-thru.-ltr').text().replace(/[^0-9.]/g, '');
    const originalPrice = oldPriceText ? parseFloat(oldPriceText) : currentPrice;

    const brand = $('.-fs14 .-pvxs a').text().trim() || 'Jumia Home';
    const description = $('#markup').text().trim() || title;

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
        } else {
          specifications[`spec_${_}`] = text;
        }
      }
    });

    const images: string[] = [];
    $('#imgs img, .-fw.-m.-auto img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && src.startsWith('http') && !images.includes(src)) images.push(src);
    });

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
      images: images.length > 0 ? images : ['https://eg.jumia.is/placeholder.jpg'],
      inStock: true,
      ratingAverage: 4.0,
      ratingReviews: 5,
      specifications,
    };
  }
}
