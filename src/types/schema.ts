import { z } from 'zod';

export const ALLOWED_STYLES = [
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
] as const;

export type StyleType = (typeof ALLOWED_STYLES)[number];

export const ALLOWED_COLORS = [
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
  'Multicolor',
] as const;

export type ColorType = (typeof ALLOWED_COLORS)[number];

export const ALLOWED_MATERIALS = [
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
  'Faux Leather',
  'Marble',
  'Stone',
  'Ceramic',
  'Concrete',
  'Rattan',
] as const;

export type MaterialType = (typeof ALLOWED_MATERIALS)[number];

export const ALLOWED_ROOM_TYPES = [
  'living_room',
  'bedroom',
  'kids_room',
  'dining_room',
  'kitchen',
  'bathroom',
  'office',
  'game_room',
  'balcony',
] as const;

export type RoomType = (typeof ALLOWED_ROOM_TYPES)[number];

export const ProductImageSchema = z.object({
  url: z.string(),
  isPrimary: z.boolean(),
});

export const UnifiedProductSchema = z.object({
  externalId: z.string(),
  sellerId: z.string().optional(),

  source: z.object({
    marketplace: z.string(),
    sellerId: z.string().optional(),
    productUrl: z.string(),
    country: z.literal('Egypt'),
    scrapedAt: z.string(),
    lastUpdated: z.string(),
  }),

  basic: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    description: z.string().nullable(),
    sku: z.string().nullable(),
  }),

  classification: z.object({
    canonicalCategory: z.string(),
    roomTypes: z.array(z.string()),
    styles: z.array(z.string()),
    materials: z.array(z.string()),
    colors: z.array(z.string()),
    tags: z.array(z.string()),
  }),

  pricing: z.object({
    currency: z.literal('EGP'),
    currentPrice: z.number().nullable(),
    originalPrice: z.number().nullable(),
    discountPercentage: z.number().nullable(),
  }),

  dimensions: z.object({
    width: z.number().nullable(),
    height: z.number().nullable(),
    length: z.number().nullable(),
    dimensionUnit: z.literal('cm'),
    weight: z.number().nullable(),
    weightUnit: z.literal('kg'),
  }),

  images: z.array(ProductImageSchema),

  availability: z.object({
    inStock: z.boolean().nullable(),
    stockStatus: z.string().nullable(),
  }),

  rating: z.object({
    average: z.number().nullable(),
    reviews: z.number().nullable(),
  }),

  ai: z.object({
    embeddingText: z.string().nullable(),
    styleLabels: z.array(z.string()),
    dominantColors: z.array(z.string()),
    roomCompatibility: z.array(z.string()),
    keywords: z.array(z.string()),
  }),

  processing: z.object({
    status: z.enum(['ACCEPTED', 'REVIEW', 'REJECTED']),
    categoryConfidence: z.number(),
    qualityScore: z.number(),
    issues: z.array(z.string()),
    normalizationVersion: z.string(),
  }),
});

export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;
