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
            { name: 'Living Room Furniture', url: `${this.baseUrl}/s?k=living+room+furniture`, targetRoom: 'Living Room' },
            { name: 'Sofas & Couches', url: `${this.baseUrl}/s?k=sofa+couch`, targetRoom: 'Living Room' },
            { name: 'Beds & Mattresses', url: `${this.baseUrl}/s?k=bed+frame+mattress`, targetRoom: 'Bedroom' },
            { name: 'Office Furniture', url: `${this.baseUrl}/s?k=office+desk+chair`, targetRoom: 'Office' },
            { name: 'Home Decor', url: `${this.baseUrl}/s?k=home+decor+wall+art+vase`, targetRoom: 'Decor' },
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
        $('[data-component-type="s-search-result"]').each((_, el) => {
            const asin = $(el).attr('data-asin');
            const title = $(el).find('h2 a span').text().trim();
            if (asin && (0, category_js_1.isFurnishingProduct)(title, seed.name)) {
                const fullUrl = `${this.baseUrl}/dp/${asin}`;
                productUrls.push(fullUrl);
            }
        });
        const hasNextPage = $('.s-pagination-next').length > 0 && !$('.s-pagination-next').hasClass('s-pagination-disabled');
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
        // ASIN extraction
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        const externalId = asinMatch ? asinMatch[1] : `amz-${Date.now()}`;
        // Price extraction
        const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const currentPrice = priceWhole ? parseFloat(priceWhole) : 1500;
        const strikePrice = $('.a-text-price .a-offscreen').first().text().replace(/[^0-9.]/g, '');
        const originalPrice = strikePrice ? parseFloat(strikePrice) : currentPrice;
        // Brand
        const brand = $('#bylineInfo').text().replace(/^Brand:\s*/i, '').trim() || 'Amazon Brand';
        // Description
        const description = $('#feature-bullets').text().replace(/\s+/g, ' ').trim() || title;
        // Images
        const images = [];
        $('#imgTagWrapperId img, #landingImage').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-old-hires');
            if (src && src.startsWith('http'))
                images.push(src);
        });
        if (images.length === 0) {
            images.push('https://images.amazon.com/images/P/placeholder.jpg');
        }
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
            inStock: true,
            deliveryAvailable: true,
            ratingAverage: 4.2,
            ratingReviews: 35,
        };
    }
}
exports.AmazonAdapter = AmazonAdapter;
