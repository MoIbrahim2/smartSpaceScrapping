"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedProductSchema = exports.ProductImageSchema = exports.ALLOWED_ROOM_TYPES = exports.ALLOWED_MATERIALS = exports.ALLOWED_COLORS = exports.ALLOWED_STYLES = void 0;
const zod_1 = require("zod");
exports.ALLOWED_STYLES = [
    'Modern',
    'Minimalist',
    'Scandinavian',
    'Industrial',
    'Bohemian',
    'Japandi',
    'Contemporary',
    'Luxury',
    'Traditional',
    'Rustic',
    'Mediterranean',
    'Classic',
    'Transitional',
];
exports.ALLOWED_COLORS = [
    'White',
    'Black',
    'Gray',
    'Brown',
    'Beige',
    'Cream',
    'Blue',
    'Green',
    'Red',
    'Yellow',
    'Orange',
    'Pink',
    'Purple',
    'Gold',
    'Silver',
    'Natural Wood',
];
exports.ALLOWED_MATERIALS = [
    'Wood',
    'Solid Wood',
    'Engineered Wood',
    'Metal',
    'Steel',
    'Glass',
    'Plastic',
    'Fabric',
    'Velvet',
    'Leather',
    'Marble',
    'Stone',
    'Ceramic',
    'Concrete',
];
exports.ALLOWED_ROOM_TYPES = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Bathroom',
    'Office',
    'Decor',
];
exports.ProductImageSchema = zod_1.z.object({
    url: zod_1.z.string(),
    isPrimary: zod_1.z.boolean(),
});
exports.UnifiedProductSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    externalId: zod_1.z.string(),
    source: zod_1.z.object({
        marketplace: zod_1.z.string(),
        country: zod_1.z.literal('Egypt'),
        productUrl: zod_1.z.string(),
        scrapedAt: zod_1.z.string(),
        lastUpdated: zod_1.z.string(),
    }),
    basic: zod_1.z.object({
        name: zod_1.z.string(),
        brand: zod_1.z.string(),
        description: zod_1.z.string(),
        sku: zod_1.z.string(),
    }),
    classification: zod_1.z.object({
        category: zod_1.z.string(),
        subcategory: zod_1.z.string(),
        roomTypes: zod_1.z.array(zod_1.z.string()),
        style: zod_1.z.array(zod_1.z.string()),
        material: zod_1.z.array(zod_1.z.string()),
        colors: zod_1.z.array(zod_1.z.string()),
        tags: zod_1.z.array(zod_1.z.string()),
    }),
    pricing: zod_1.z.object({
        currency: zod_1.z.literal('EGP'),
        currentPrice: zod_1.z.number().nonnegative(),
        originalPrice: zod_1.z.number().nonnegative(),
        discountPercentage: zod_1.z.number().min(0).max(100),
    }),
    dimensions: zod_1.z.object({
        width: zod_1.z.number().nullable(),
        height: zod_1.z.number().nullable(),
        depth: zod_1.z.number().nullable(),
        weight: zod_1.z.number().nullable(),
        unit: zod_1.z.literal('cm'),
    }),
    images: zod_1.z.array(exports.ProductImageSchema),
    availability: zod_1.z.object({
        inStock: zod_1.z.boolean(),
        stockStatus: zod_1.z.string(),
        deliveryAvailable: zod_1.z.boolean(),
    }),
    rating: zod_1.z.object({
        average: zod_1.z.number().min(0).max(5),
        reviews: zod_1.z.number().min(0),
    }),
    ai: zod_1.z.object({
        embeddingText: zod_1.z.string(),
        styleLabels: zod_1.z.array(zod_1.z.string()),
        dominantColors: zod_1.z.array(zod_1.z.string()),
        roomCompatibility: zod_1.z.array(zod_1.z.string()),
        keywords: zod_1.z.array(zod_1.z.string()),
    }),
});
