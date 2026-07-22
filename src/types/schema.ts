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
  'Marble',
  'Stone',
  'Ceramic',
  'Concrete',
] as const;

export type MaterialType = (typeof ALLOWED_MATERIALS)[number];

export const ALLOWED_ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Decor',
] as const;

export type RoomType = (typeof ALLOWED_ROOM_TYPES)[number];

export const ProductImageSchema = z.object({
  url: z.string(),
  isPrimary: z.boolean(),
});

export const UnifiedProductSchema = z.object({
  _id: z.string().optional(),

  externalId: z.string(),

  source: z.object({
    marketplace: z.string(),
    country: z.literal('Egypt'),
    productUrl: z.string(),
    scrapedAt: z.string(),
    lastUpdated: z.string(),
  }),

  basic: z.object({
    name: z.string(),
    brand: z.string(),
    description: z.string(),
    sku: z.string(),
  }),

  classification: z.object({
    category: z.string(),
    subcategory: z.string(),
    roomTypes: z.array(z.string()),
    style: z.array(z.string()),
    material: z.array(z.string()),
    colors: z.array(z.string()),
    tags: z.array(z.string()),
  }),

  pricing: z.object({
    currency: z.literal('EGP'),
    currentPrice: z.number().nonnegative(),
    originalPrice: z.number().nonnegative(),
    discountPercentage: z.number().min(0).max(100),
  }),

  dimensions: z.object({
    width: z.number().nullable(),
    height: z.number().nullable(),
    depth: z.number().nullable(),
    weight: z.number().nullable(),
    unit: z.literal('cm'),
  }),

  images: z.array(ProductImageSchema),

  availability: z.object({
    inStock: z.boolean(),
    stockStatus: z.string(),
    deliveryAvailable: z.boolean(),
  }),

  rating: z.object({
    average: z.number().min(0).max(5),
    reviews: z.number().min(0),
  }),

  ai: z.object({
    embeddingText: z.string(),
    styleLabels: z.array(z.string()),
    dominantColors: z.array(z.string()),
    roomCompatibility: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
});

export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;
