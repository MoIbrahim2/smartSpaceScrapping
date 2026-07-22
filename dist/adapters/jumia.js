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
exports.JumiaAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
const base_js_1 = require("./base.js");
const category_js_1 = require("../normalizers/category.js");
const logger_js_1 = require("../core/logger.js");
class JumiaAdapter extends base_js_1.BaseAdapter {
    name = 'Jumia Egypt';
    baseUrl = 'https://www.jumia.com.eg';
    async getCategorySeeds() {
        return [
            { name: 'Home & Office Furniture', url: `${this.baseUrl}/ar/home-office-furniture/`, targetRoom: 'Living Room' },
            { name: 'Home Decor', url: `${this.baseUrl}/ar/home-decor/`, targetRoom: 'Decor' },
            { name: 'Bedding & Bedroom', url: `${this.baseUrl}/ar/bedding/`, targetRoom: 'Bedroom' },
        ];
    }
    async scrapeCategoryPage(seed, page) {
        const pageUrl = `${seed.url}?page=${page}`;
        logger_js_1.logger.info(`[JumiaAdapter] Scraping category page ${page}: ${pageUrl}`);
        const html = await this.httpClient.fetch(pageUrl);
        if (!html) {
            return { productUrls: [], hasNextPage: false };
        }
        const $ = cheerio.load(html);
        const productUrls = [];
        $('article.prd').each((_, el) => {
            const link = $(el).find('a.core').attr('href');
            const title = $(el).find('.name').text().trim();
            if (link && (0, category_js_1.isFurnishingProduct)(title, seed.name)) {
                const fullUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
                productUrls.push(fullUrl);
            }
        });
        const hasNextPage = $('a[aria-label="الصفحة التالية"], a[aria-label="Next Page"]').length > 0;
        return {
            productUrls,
            hasNextPage,
            nextPageUrl: hasNextPage ? `${seed.url}?page=${page + 1}` : undefined,
        };
    }
    async scrapeProduct(url) {
        logger_js_1.logger.info(`[JumiaAdapter] Scraping product detail: ${url}`);
        const html = await this.httpClient.fetch(url);
        if (!html)
            return null;
        const $ = cheerio.load(html);
        const title = $('h1.-fs20').text().trim() || $('h1').first().text().trim();
        if (!title)
            return null;
        const skuMatch = url.match(/-([0-9a-zA-Z]+)\.html/);
        const externalId = skuMatch ? skuMatch[1] : `jumia-${Date.now()}`;
        const priceText = $('span.-b.-ltr.-i.-e30.-mrxs').text().replace(/[^0-9.]/g, '') || $('span.-b.-ltr').first().text().replace(/[^0-9.]/g, '');
        const currentPrice = priceText ? parseFloat(priceText) : 1200;
        const oldPriceText = $('span.-s.-line-thru.-ltr').text().replace(/[^0-9.]/g, '');
        const originalPrice = oldPriceText ? parseFloat(oldPriceText) : currentPrice;
        const brand = $('.-fs14 .-pvxs a').text().trim() || 'Jumia Home';
        const description = $('#markup').text().trim() || title;
        const images = [];
        $('#imgs img, .-fw.-m.-auto img').each((_, el) => {
            const src = $(el).attr('data-src') || $(el).attr('src');
            if (src && src.startsWith('http'))
                images.push(src);
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
        };
    }
}
exports.JumiaAdapter = JumiaAdapter;
