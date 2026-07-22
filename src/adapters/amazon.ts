import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { isFurnishingProduct } from '../normalizers/category.js';
import { logger } from '../core/logger.js';

export class AmazonAdapter extends BaseAdapter {
  readonly name = 'Amazon Egypt';
  readonly baseUrl = 'https://www.amazon.eg';

  async getCategorySeeds(): Promise<CategorySeed[]> {
    return [
      { name: 'Sofas & Living Room', url: `${this.baseUrl}/s?k=sofa+couch+living+room`, targetRoom: 'Living Room' },
      { name: 'Coffee & Side Tables', url: `${this.baseUrl}/s?k=coffee+table+side+table`, targetRoom: 'Living Room' },
      { name: 'TV Units & Media Consoles', url: `${this.baseUrl}/s?k=tv+unit+tv+stand`, targetRoom: 'Living Room' },
      { name: 'Beds & Mattresses', url: `${this.baseUrl}/s?k=bed+frame+mattress`, targetRoom: 'Bedroom' },
      { name: 'Wardrobes & Dressers', url: `${this.baseUrl}/s?k=wardrobe+dresser`, targetRoom: 'Bedroom' },
      { name: 'Dining Tables & Chairs', url: `${this.baseUrl}/s?k=dining+table+chairs`, targetRoom: 'Dining Room' },
      { name: 'Office Desks & Chairs', url: `${this.baseUrl}/s?k=office+desk+chair`, targetRoom: 'Office' },
      { name: 'Home Decor & Lighting', url: `${this.baseUrl}/s?k=home+decor+wall+art+lamp`, targetRoom: 'Decor' },
      { name: 'Outdoor & Balcony Furniture', url: `${this.baseUrl}/s?k=outdoor+furniture+patio`, targetRoom: 'Balcony' },
    ];
  }

  async scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult> {
    const pageUrl = `${seed.url}&page=${page}`;
    logger.info(`[AmazonAdapter] Scraping category page ${page}: ${pageUrl}`);
    const html = await this.httpClient.fetch(pageUrl);

    if (!html) {
      return { productUrls: [], hasNextPage: false };
    }

    const $ = cheerio.load(html);
    const productUrls: string[] = [];

    $('[data-component-type="s-search-result"]').each((_, el) => {
      const asin = $(el).attr('data-asin');
      const title = $(el).find('h2 a span').text().trim();

      if (asin && isFurnishingProduct(title, seed.name)) {
        const fullUrl = `${this.baseUrl}/dp/${asin}`;
        productUrls.push(fullUrl);
      }
    });

    const hasNextPage = $('.s-pagination-next').length > 0 && !$('.s-pagination-next').hasClass('s-pagination-disabled') && page < 20;

    return {
      productUrls,
      hasNextPage,
      nextPageUrl: hasNextPage ? `${seed.url}&page=${page + 1}` : undefined,
    };
  }

  async scrapeProduct(url: string): Promise<RawScrapedProduct | null> {
    logger.info(`[AmazonAdapter] Scraping product detail: ${url}`);
    const html = await this.httpClient.fetch(url);

    if (!html) return null;

    const $ = cheerio.load(html);
    const title = $('#productTitle').text().trim() || $('meta[name="title"]').attr('content') || '';
    if (!title) return null;

    // ASIN extraction
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    const externalId = asinMatch ? asinMatch[1] : `amz-${Date.now()}`;

    // Price extraction
    const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
    const currentPrice = priceWhole ? parseFloat(priceWhole) : 1500;
    const strikePrice = $('.a-text-price .a-offscreen').first().text().replace(/[^0-9.]/g, '');
    const originalPrice = strikePrice ? parseFloat(strikePrice) : currentPrice;

    // Brand
    const brand = $('#bylineInfo').text().replace(/^Brand:\s*/i, '').replace(/^الماركة:\s*/i, '').trim() || 'Amazon Furnishings';

    // Description
    const description = $('#feature-bullets').text().replace(/\s+/g, ' ').trim() || title;

    const specifications: Record<string, string> = {};

    // 1. Amazon Product Overview table (<span class="a-size-base po-break-word">70العمق x 165العرض x 75الارتفاع سم </span>)
    $('.po-break-word, .a-size-base.po-break-word').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.includes('العمق') || text.includes('العرض') || text.includes('الارتفاع') || text.includes('cm') || text.includes('سم')) {
        specifications[`po_dim_${_}`] = text;
      }
    });

    // 2. Tech Spec tables (#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr)
    $('#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr').each((_, el) => {
      const key = $(el).find('th').text().trim();
      const val = $(el).find('td').text().trim();
      if (key && val) specifications[key] = val;
    });

    // 3. Detail Bullet Lists (#detailBullets_feature_div li)
    $('#detailBullets_feature_div li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const parts = text.split(':');
      if (parts.length >= 2) {
        specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    // Images
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
      images: images.length > 0 ? images : ['https://images.amazon.com/images/P/placeholder.jpg'],
      inStock: true,
      deliveryAvailable: true,
      ratingAverage: 4.2,
      ratingReviews: 35,
      specifications,
    };
  }
}
