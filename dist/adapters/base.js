"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
const schema_js_1 = require("../types/schema.js");
const category_js_1 = require("../normalizers/category.js");
const style_js_1 = require("../normalizers/style.js");
const color_js_1 = require("../normalizers/color.js");
const material_js_1 = require("../normalizers/material.js");
const room_js_1 = require("../normalizers/room.js");
const dimensions_js_1 = require("../normalizers/dimensions.js");
const aiEnrichment_js_1 = require("../normalizers/aiEnrichment.js");
const logger_js_1 = require("../core/logger.js");
class BaseAdapter {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    transform(raw) {
        const rawName = raw.name || 'Untitled Home Product';
        const rawDesc = raw.description || '';
        const rawCategory = raw.rawCategory || '';
        // Step 1: Normalize Category
        const categoryMapping = (0, category_js_1.normalizeCategory)(rawName, rawCategory);
        // Step 2: Normalize Attributes
        const combinedText = `${rawName} ${rawDesc} ${rawCategory} ${raw.rawStyle || ''} ${raw.rawMaterial || ''} ${raw.rawColor || ''}`;
        const styles = (0, style_js_1.normalizeStyles)(combinedText, categoryMapping.category);
        const colors = (0, color_js_1.normalizeColors)(combinedText);
        const materials = (0, material_js_1.normalizeMaterials)(combinedText);
        const roomTypes = (0, room_js_1.inferRoomTypes)(categoryMapping.category, combinedText);
        // Step 3: Dimensions Extractor (with Category Fallback Engine)
        const extractedDims = (0, dimensions_js_1.extractDimensions)(raw.specifications || {}, rawName, rawDesc, categoryMapping.category);
        const finalWidth = raw.width ?? extractedDims.width;
        const finalHeight = raw.height ?? extractedDims.height;
        const finalDepth = raw.depth ?? extractedDims.depth;
        const finalWeight = raw.weight ?? extractedDims.weight;
        // Step 4: AI Enrichment
        const aiData = (0, aiEnrichment_js_1.enrichProductAI)(rawName, rawDesc, raw.brand || this.name, categoryMapping.category, styles, colors, materials, roomTypes);
        // Step 5: Images format
        const formattedImages = raw.images.map((imgUrl, index) => ({
            url: imgUrl,
            isPrimary: index === 0,
        }));
        if (formattedImages.length === 0) {
            formattedImages.push({
                url: 'https://via.placeholder.com/600x600.png?text=SmartSpaceAI+Furniture',
                isPrimary: true,
            });
        }
        // Step 6: Pricing calculations
        const curPrice = Math.max(0, raw.currentPrice || 0);
        const origPrice = Math.max(curPrice, raw.originalPrice || curPrice);
        const discount = origPrice > curPrice ? Math.round(((origPrice - curPrice) / origPrice) * 100) : 0;
        const nowIso = new Date().toISOString();
        const candidate = {
            externalId: raw.externalId,
            source: {
                marketplace: this.name,
                country: 'Egypt',
                productUrl: raw.productUrl,
                scrapedAt: nowIso,
                lastUpdated: nowIso,
            },
            basic: {
                name: rawName,
                brand: raw.brand || 'Generic',
                description: rawDesc,
                sku: raw.sku || raw.externalId,
            },
            classification: {
                canonicalCategory: categoryMapping.category,
                roomTypes: roomTypes,
                styles: styles,
                materials: materials,
                colors: colors,
                tags: [categoryMapping.category, ...styles, ...colors],
            },
            pricing: {
                currency: 'EGP',
                currentPrice: curPrice,
                originalPrice: origPrice,
                discountPercentage: discount,
            },
            dimensions: {
                width: finalWidth,
                height: finalHeight,
                length: finalDepth,
                dimensionUnit: 'cm',
                weight: finalWeight,
                weightUnit: 'kg',
            },
            images: formattedImages,
            availability: {
                inStock: raw.inStock ?? true,
                stockStatus: raw.stockStatus || (raw.inStock === false ? 'Out of Stock' : 'In Stock'),
            },
            rating: {
                average: Math.min(5, Math.max(0, raw.ratingAverage || 0)),
                reviews: Math.max(0, raw.ratingReviews || 0),
            },
            ai: aiData,
            processing: {
                status: 'ACCEPTED',
                categoryConfidence: 0.9,
                qualityScore: 70,
                issues: [],
                normalizationVersion: '1.0'
            }
        };
        // Validate schema
        const result = schema_js_1.UnifiedProductSchema.safeParse(candidate);
        if (!result.success) {
            logger_js_1.logger.error(`Validation failed for product ${raw.externalId}: ${result.error.message}`);
            throw new Error(`Unified Schema validation error: ${result.error.message}`);
        }
        return result.data;
    }
}
exports.BaseAdapter = BaseAdapter;
