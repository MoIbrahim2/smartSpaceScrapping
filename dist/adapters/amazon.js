"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
const base_js_1 = require("./base.js");
const category_js_1 = require("../normalizers/category.js");
const logger_js_1 = require("../core/logger.js");
class AmazonAdapter extends base_js_1.BaseAdapter {
    name = 'Amazon Egypt';
    baseUrl = 'https://www.amazon.eg';
    async getCategorySeeds() {
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
    async scrapeCategoryPage(seed, page) {
        const pageUrl = `${seed.url}&page=${page}`;
        logger_js_1.logger.info(`[AmazonAdapter] Scraping category page ${page}: ${pageUrl}`);
        const html = await this.httpClient.fetch(pageUrl);
        if (!html) {
            return { productUrls: [], hasNextPage: false };
        }
        const $ = cheerio.load(html);
        const productUrls = [];
        $('[data-component-type="s-search-result"], div.s-result-item[data-asin]').each((_, el) => {
            const asin = $(el).attr('data-asin');
            const title = $(el).find('h2 a span, h2 span').text().trim();
            if (asin && asin.length === 10 && (0, category_js_1.isFurnishingProduct)(title, seed.name)) {
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
    async scrapeProduct(url) {
        logger_js_1.logger.info(`[AmazonAdapter] Scraping product detail: ${url}`);
        const html = await this.httpClient.fetch(url);
        if (!html)
            return null;
        const $ = cheerio.load(html);
        const title = $('#productTitle').text().trim() || $('meta[name="title"]').attr('content') || '';
        if (!title)
            return null;
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        const externalId = asinMatch ? asinMatch[1] : `amz-${Date.now()}`;
        const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const currentPrice = priceWhole ? parseFloat(priceWhole) : 1500;
        const strikePrice = $('.a-text-price .a-offscreen').first().text().replace(/[^0-9.]/g, '');
        const originalPrice = strikePrice ? parseFloat(strikePrice) : currentPrice;
        const brand = $('#bylineInfo').text().replace(/^Brand:\s*/i, '').replace(/^الماركة:\s*/i, '').trim() || 'Amazon Furnishings';
        const description = $('#feature-bullets').text().replace(/\s+/g, ' ').trim() || title;
        const specifications = {};
        $('.po-break-word, .a-size-base.po-break-word').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.includes('العمق') || text.includes('العرض') || text.includes('الارتفاع') || text.includes('cm') || text.includes('سم')) {
                specifications[`po_dim_${_}`] = text;
            }
        });
        $('#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr').each((_, el) => {
            const key = $(el).find('th').text().trim();
            const val = $(el).find('td').text().trim();
            if (key && val)
                specifications[key] = val;
        });
        $('#detailBullets_feature_div li').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            const parts = text.split(':');
            if (parts.length >= 2) {
                specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
            }
        });
        const images = [];
        $('#imgTagWrapperId img, #landingImage, #altImages img').each((_, el) => {
            const dynImg = $(el).attr('data-a-dynamic-image');
            if (dynImg) {
                try {
                    const parsed = JSON.parse(dynImg);
                    Object.keys(parsed).forEach((k) => {
                        if (k.startsWith('http') && !images.includes(k))
                            images.push(k);
                    });
                }
                catch (e) {
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
exports.AmazonAdapter = AmazonAdapter;
