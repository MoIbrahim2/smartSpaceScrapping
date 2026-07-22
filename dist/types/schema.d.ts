import { z } from 'zod';
export declare const ALLOWED_STYLES: readonly ["Modern", "Minimalist", "Scandinavian", "Industrial", "Bohemian", "Japandi", "Contemporary", "Luxury", "Traditional", "Rustic", "Mediterranean", "Classic", "Transitional"];
export type StyleType = (typeof ALLOWED_STYLES)[number];
export declare const ALLOWED_COLORS: readonly ["White", "Black", "Gray", "Brown", "Beige", "Cream", "Blue", "Green", "Red", "Yellow", "Orange", "Pink", "Purple", "Gold", "Silver", "Natural Wood"];
export type ColorType = (typeof ALLOWED_COLORS)[number];
export declare const ALLOWED_MATERIALS: readonly ["Wood", "Solid Wood", "Engineered Wood", "Metal", "Steel", "Glass", "Plastic", "Fabric", "Velvet", "Leather", "Marble", "Stone", "Ceramic", "Concrete"];
export type MaterialType = (typeof ALLOWED_MATERIALS)[number];
export declare const ALLOWED_ROOM_TYPES: readonly ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Decor"];
export type RoomType = (typeof ALLOWED_ROOM_TYPES)[number];
export declare const ProductImageSchema: z.ZodObject<{
    url: z.ZodString;
    isPrimary: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string;
    isPrimary: boolean;
}, {
    url: string;
    isPrimary: boolean;
}>;
export declare const UnifiedProductSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    externalId: z.ZodString;
    source: z.ZodObject<{
        marketplace: z.ZodString;
        country: z.ZodLiteral<"Egypt">;
        productUrl: z.ZodString;
        scrapedAt: z.ZodString;
        lastUpdated: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        marketplace: string;
        country: "Egypt";
        productUrl: string;
        scrapedAt: string;
        lastUpdated: string;
    }, {
        marketplace: string;
        country: "Egypt";
        productUrl: string;
        scrapedAt: string;
        lastUpdated: string;
    }>;
    basic: z.ZodObject<{
        name: z.ZodString;
        brand: z.ZodString;
        description: z.ZodString;
        sku: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        brand: string;
        description: string;
        sku: string;
    }, {
        name: string;
        brand: string;
        description: string;
        sku: string;
    }>;
    classification: z.ZodObject<{
        category: z.ZodString;
        subcategory: z.ZodString;
        roomTypes: z.ZodArray<z.ZodString, "many">;
        style: z.ZodArray<z.ZodString, "many">;
        material: z.ZodArray<z.ZodString, "many">;
        colors: z.ZodArray<z.ZodString, "many">;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        category: string;
        subcategory: string;
        roomTypes: string[];
        style: string[];
        material: string[];
        colors: string[];
        tags: string[];
    }, {
        category: string;
        subcategory: string;
        roomTypes: string[];
        style: string[];
        material: string[];
        colors: string[];
        tags: string[];
    }>;
    pricing: z.ZodObject<{
        currency: z.ZodLiteral<"EGP">;
        currentPrice: z.ZodNumber;
        originalPrice: z.ZodNumber;
        discountPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        currency: "EGP";
        currentPrice: number;
        originalPrice: number;
        discountPercentage: number;
    }, {
        currency: "EGP";
        currentPrice: number;
        originalPrice: number;
        discountPercentage: number;
    }>;
    dimensions: z.ZodObject<{
        width: z.ZodNullable<z.ZodNumber>;
        height: z.ZodNullable<z.ZodNumber>;
        depth: z.ZodNullable<z.ZodNumber>;
        weight: z.ZodNullable<z.ZodNumber>;
        unit: z.ZodLiteral<"cm">;
    }, "strip", z.ZodTypeAny, {
        width: number | null;
        height: number | null;
        depth: number | null;
        weight: number | null;
        unit: "cm";
    }, {
        width: number | null;
        height: number | null;
        depth: number | null;
        weight: number | null;
        unit: "cm";
    }>;
    images: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        url: string;
        isPrimary: boolean;
    }, {
        url: string;
        isPrimary: boolean;
    }>, "many">;
    availability: z.ZodObject<{
        inStock: z.ZodBoolean;
        stockStatus: z.ZodString;
        deliveryAvailable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        inStock: boolean;
        stockStatus: string;
        deliveryAvailable: boolean;
    }, {
        inStock: boolean;
        stockStatus: string;
        deliveryAvailable: boolean;
    }>;
    rating: z.ZodObject<{
        average: z.ZodNumber;
        reviews: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        average: number;
        reviews: number;
    }, {
        average: number;
        reviews: number;
    }>;
    ai: z.ZodObject<{
        embeddingText: z.ZodString;
        styleLabels: z.ZodArray<z.ZodString, "many">;
        dominantColors: z.ZodArray<z.ZodString, "many">;
        roomCompatibility: z.ZodArray<z.ZodString, "many">;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        embeddingText: string;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    }, {
        embeddingText: string;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    externalId: string;
    source: {
        marketplace: string;
        country: "Egypt";
        productUrl: string;
        scrapedAt: string;
        lastUpdated: string;
    };
    basic: {
        name: string;
        brand: string;
        description: string;
        sku: string;
    };
    classification: {
        category: string;
        subcategory: string;
        roomTypes: string[];
        style: string[];
        material: string[];
        colors: string[];
        tags: string[];
    };
    pricing: {
        currency: "EGP";
        currentPrice: number;
        originalPrice: number;
        discountPercentage: number;
    };
    dimensions: {
        width: number | null;
        height: number | null;
        depth: number | null;
        weight: number | null;
        unit: "cm";
    };
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    availability: {
        inStock: boolean;
        stockStatus: string;
        deliveryAvailable: boolean;
    };
    rating: {
        average: number;
        reviews: number;
    };
    ai: {
        embeddingText: string;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    };
    _id?: string | undefined;
}, {
    externalId: string;
    source: {
        marketplace: string;
        country: "Egypt";
        productUrl: string;
        scrapedAt: string;
        lastUpdated: string;
    };
    basic: {
        name: string;
        brand: string;
        description: string;
        sku: string;
    };
    classification: {
        category: string;
        subcategory: string;
        roomTypes: string[];
        style: string[];
        material: string[];
        colors: string[];
        tags: string[];
    };
    pricing: {
        currency: "EGP";
        currentPrice: number;
        originalPrice: number;
        discountPercentage: number;
    };
    dimensions: {
        width: number | null;
        height: number | null;
        depth: number | null;
        weight: number | null;
        unit: "cm";
    };
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    availability: {
        inStock: boolean;
        stockStatus: string;
        deliveryAvailable: boolean;
    };
    rating: {
        average: number;
        reviews: number;
    };
    ai: {
        embeddingText: string;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    };
    _id?: string | undefined;
}>;
export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;
