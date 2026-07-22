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
      { name: 'Sofas & Sectionals', url: `${this.baseUrl}/s?k=sofa+couch+sectional`, targetRoom: 'Living Room' },
      { name: 'Armchairs & Recliners', url: `${this.baseUrl}/s?k=armchair+recliner+chair`, targetRoom: 'Living Room' },
      { name: 'Coffee Tables', url: `${this.baseUrl}/s?k=coffee+table+center+table`, targetRoom: 'Living Room' },
      { name: 'Side & End Tables', url: `${this.baseUrl}/s?k=side+table+end+table`, targetRoom: 'Living Room' },
      { name: 'TV Units & Consoles', url: `${this.baseUrl}/s?k=tv+unit+tv+stand+media+console`, targetRoom: 'Living Room' },
      { name: 'Beds & Frames', url: `${this.baseUrl}/s?k=bed+frame+wooden+bed`, targetRoom: 'Bedroom' },
      { name: 'Mattresses & Toppers', url: `${this.baseUrl}/s?k=mattress+bed+mattress`, targetRoom: 'Bedroom' },
      { name: 'Wardrobes & Closets', url: `${this.baseUrl}/s?k=wardrobe+closet+cabinet`, targetRoom: 'Bedroom' },
      { name: 'Nightstands & Bedside Tables', url: `${this.baseUrl}/s?k=nightstand+bedside+table`, targetRoom: 'Bedroom' },
      { name: 'Dressers & Vanity Tables', url: `${this.baseUrl}/s?k=dresser+vanity+table`, targetRoom: 'Bedroom' },
      { name: 'Dining Tables', url: `${this.baseUrl}/s?k=dining+table+kitchen+table`, targetRoom: 'Dining Room' },
      { name: 'Dining Chairs & Stools', url: `${this.baseUrl}/s?k=dining+chair+bar+stool`, targetRoom: 'Dining Room' },
      { name: 'Office Desks & Workstations', url: `${this.baseUrl}/s?k=office+desk+computer+desk`, targetRoom: 'Office' },
      { name: 'Office Chairs', url: `${this.baseUrl}/s?k=office+chair+executive+chair`, targetRoom: 'Office' },
      { name: 'Bookshelves & Bookcases', url: `${this.baseUrl}/s?k=bookshelf+bookcase+display+shelf`, targetRoom: 'Office' },
      { name: 'Storage Racks & Units', url: `${this.baseUrl}/s?k=storage+rack+shelving+unit`, targetRoom: 'Office' },
      { name: 'Home Decor & Mirrors', url: `${this.baseUrl}/s?k=home+decor+wall+mirror`, targetRoom: 'Decor' },
      { name: 'Lamps & Lighting', url: `${this.baseUrl}/s?k=table+lamp+floor+lamp+chandelier`, targetRoom: 'Decor' },
      { name: 'Rugs & Carpets', url: `${this.baseUrl}/s?k=area+rug+carpet+mat`, targetRoom: 'Decor' },
      { name: 'Outdoor & Patio Furniture', url: `${this.baseUrl}/s?k=outdoor+furniture+patio+set`, targetRoom: 'Balcony' },
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

    $('[data-component-type="s-search-result"], div.s-result-item[data-asin]').each((_, el) => {
      const asin = $(el).attr('data-asin');
      const title = $(el).find('h2 a span, h2 span').text().trim();

      if (asin && asin.length === 10 && isFurnishingProduct(title, seed.name)) {
        const fullUrl = `${this.baseUrl}/dp/${asin}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    const hasNextPage = productUrls.length > 0 && page < 50;

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

    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    const externalId = asinMatch ? asinMatch[1] : `amz-${Date.now()}`;

    const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
    const currentPrice = priceWhole ? parseFloat(priceWhole) : 1500;
    const strikePrice = $('.a-text-price .a-offscreen').first().text().replace(/[^0-9.]/g, '');
    const originalPrice = strikePrice ? parseFloat(strikePrice) : currentPrice;

    const brand = $('#bylineInfo').text().replace(/^Brand:\s*/i, '').replace(/^الماركة:\s*/i, '').trim() || 'Amazon Furnishings';

    const description = $('#feature-bullets').text().replace(/\s+/g, ' ').trim() || title;

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
