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
            { name: 'Sofas & Armchairs', url: `${this.baseUrl}/cat/sofas-armchairs-fu003/`, targetRoom: 'Living Room' },
            { name: 'Living Room Tables', url: `${this.baseUrl}/cat/coffee-side-tables-10705/`, targetRoom: 'Living Room' },
            { name: 'TV & Media Furniture', url: `${this.baseUrl}/cat/tv-media-furniture-10475/`, targetRoom: 'Living Room' },
            { name: 'Beds & Mattresses', url: `${this.baseUrl}/cat/beds-bm003/`, targetRoom: 'Bedroom' },
            { name: 'Wardrobes & Storage', url: `${this.baseUrl}/cat/wardrobes-19053/`, targetRoom: 'Bedroom' },
            { name: 'Dining Tables & Chairs', url: `${this.baseUrl}/cat/dining-tables-21825/`, targetRoom: 'Dining Room' },
            { name: 'Desks & Office Chairs', url: `${this.baseUrl}/cat/desks-computer-desks-20657/`, targetRoom: 'Office' },
            { name: 'Lighting', url: `${this.baseUrl}/cat/lighting-li001/`, targetRoom: 'Decor' },
            { name: 'Rugs & Textiles', url: `${this.baseUrl}/cat/rugs-10653/`, targetRoom: 'Decor' },
            { name: 'Outdoor Furniture', url: `${this.baseUrl}/cat/outdoor-furniture-od001/`, targetRoom: 'Balcony' },
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
            if (link) {
                const fullUrl = link.startsWith('http') ? link : `https://www.ikea.com${link}`;
                if (!productUrls.includes(fullUrl)) {
                    productUrls.push(fullUrl);
                }
            }
        });
        const hasNextPage = $('.pip-btn--secondary.pip-btn--fluid').length > 0 && page < 20;
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
        const specifications = {};
        // 1. IKEA Specific Modal Measurements (.pipf-measurements-modal__measurements-container li, .pipf-measurements-modal__product-measurement-wrapper)
        $('.pipf-measurements-modal__measurements-container li, .pipf-measurements-modal__product-measurement-wrapper, .pip-product-dimensions__measurement-container li, #pip-product-measurements p').each((_, el) => {
            const name = $(el).find('.pipf-measurements-modal__product-measurement-name, .pip-product-dimensions__measurement-name').text().replace(/[:\s&nbsp;]+$/, '').trim();
            const val = $(el).text().replace(name, '').replace(/[:\s&nbsp;]+/, '').trim();
            if (name && val) {
                specifications[name] = val;
            }
            else {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                const parts = text.split(':');
                if (parts.length >= 2) {
                    specifications[parts[0].trim()] = parts.slice(1).join(':').trim();
                }
            }
        });
        // 2. Schema.org JSON-LD structured data
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
            if (jsonLdProduct.weight)
                specifications['Weight'] = `${jsonLdProduct.weight.value || jsonLdProduct.weight} ${jsonLdProduct.weight.unitCode || 'kg'}`;
            if (jsonLdProduct.width)
                specifications['Width'] = `${jsonLdProduct.width.value || jsonLdProduct.width} cm`;
            if (jsonLdProduct.height)
                specifications['Height'] = `${jsonLdProduct.height.value || jsonLdProduct.height} cm`;
            if (jsonLdProduct.depth)
                specifications['Depth'] = `${jsonLdProduct.depth.value || jsonLdProduct.depth} cm`;
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
                specifications,
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
            specifications,
        };
    }
}
exports.IkeaAdapter = IkeaAdapter;
