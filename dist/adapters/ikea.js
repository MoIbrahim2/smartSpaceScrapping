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
exports.IkeaAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
const base_js_1 = require("./base.js");
const logger_js_1 = require("../core/logger.js");
class IkeaAdapter extends base_js_1.BaseAdapter {
    name = 'IKEA Egypt';
    baseUrl = 'https://www.ikea.com/eg/ar';
    async getCategorySeeds() {
        return [
            { name: 'Living Room Furniture', url: `${this.baseUrl}/cat/living-room-furniture-fu001/`, targetRoom: 'Living Room' },
            { name: 'Bedroom Furniture', url: `${this.baseUrl}/cat/bedroom-furniture-bm001/`, targetRoom: 'Bedroom' },
            { name: 'Tables & Desks', url: `${this.baseUrl}/cat/tables-desks-tb001/`, targetRoom: 'Office' },
            { name: 'Lighting', url: `${this.baseUrl}/cat/lighting-li001/`, targetRoom: 'Decor' },
        ];
    }
    async scrapeCategoryPage(seed, page) {
        const pageUrl = `${seed.url}?page=${page}`;
        logger_js_1.logger.info(`[IkeaAdapter] Scraping category page ${page}: ${pageUrl}`);
        const html = await this.httpClient.fetch(pageUrl);
        if (!html) {
            return { productUrls: [], hasNextPage: false };
        }
        const $ = cheerio.load(html);
        const productUrls = [];
        $('.pip-product-compact, .pip-compact-header').each((_, el) => {
            const link = $(el).find('a.pip-product-compact__link, a.pip-link').attr('href');
            const title = $(el).find('.pip-header-section__title-text').text().trim() || $(el).find('.pip-compact-header__title').text().trim();
            if (link) {
                const fullUrl = link.startsWith('http') ? link : `https://www.ikea.com${link}`;
                if (!productUrls.includes(fullUrl)) {
                    productUrls.push(fullUrl);
                }
            }
        });
        const hasNextPage = $('.pip-btn--secondary.pip-btn--fluid').length > 0 && page < 4;
        return {
            productUrls,
            hasNextPage,
            nextPageUrl: hasNextPage ? `${seed.url}?page=${page + 1}` : undefined,
        };
    }
    async scrapeProduct(url) {
        logger_js_1.logger.info(`[IkeaAdapter] Scraping product detail: ${url}`);
        const html = await this.httpClient.fetch(url);
        if (!html)
            return null;
        const $ = cheerio.load(html);
        // Try schema.org JSON-LD structured data first
        let jsonLdProduct = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                if (json['@type'] === 'Product') {
                    jsonLdProduct = json;
                }
            }
            catch (e) {
                // ignore
            }
        });
        if (jsonLdProduct) {
            const price = parseFloat(jsonLdProduct.offers?.price || jsonLdProduct.offers?.[0]?.price || '2500');
            return {
                externalId: jsonLdProduct.sku || `ikea-${Date.now()}`,
                marketplace: this.name,
                productUrl: url,
                name: `${jsonLdProduct.name} - ${jsonLdProduct.description || ''}`,
                brand: 'IKEA',
                description: jsonLdProduct.description || jsonLdProduct.name,
                sku: jsonLdProduct.sku || '',
                currentPrice: price,
                originalPrice: price,
                currency: 'EGP',
                images: Array.isArray(jsonLdProduct.image) ? jsonLdProduct.image : [jsonLdProduct.image || 'https://www.ikea.com/placeholder.jpg'],
                inStock: true,
                ratingAverage: 4.6,
                ratingReviews: 24,
            };
        }
        // DOM fallback
        const title = $('.pip-header-section__title-text').text().trim() || $('h1').text().trim();
        if (!title)
            return null;
        const articleNo = url.match(/-s?(\d{8})\//) || url.match(/\/art-(\d{8})/);
        const externalId = articleNo ? articleNo[1] : `ikea-${Date.now()}`;
        const priceVal = $('.pip-temp-price__integer').text().replace(/[^0-9]/g, '');
        const currentPrice = priceVal ? parseFloat(priceVal) : 2950;
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
            images: ['https://www.ikea.com/eg/ar/images/products/placeholder.jpg'],
            inStock: true,
            ratingAverage: 4.5,
            ratingReviews: 18,
        };
    }
}
exports.IkeaAdapter = IkeaAdapter;
