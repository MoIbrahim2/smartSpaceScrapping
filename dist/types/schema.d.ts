import { z } from 'zod';
export declare const ALLOWED_STYLES: readonly ["Modern", "Minimalist", "Scandinavian", "Industrial", "Bohemian", "Japandi", "Contemporary", "Luxury", "Traditional", "Rustic", "Mediterranean", "Classic", "Transitional"];
export type StyleType = (typeof ALLOWED_STYLES)[number];
export declare const ALLOWED_COLORS: readonly ["White", "Black", "Gray", "Brown", "Beige", "Cream", "Blue", "Green", "Red", "Yellow", "Orange", "Pink", "Purple", "Gold", "Silver", "Natural Wood", "Multicolor"];
export type ColorType = (typeof ALLOWED_COLORS)[number];
export declare const ALLOWED_MATERIALS: readonly ["Wood", "Solid Wood", "Engineered Wood", "Metal", "Steel", "Glass", "Plastic", "Fabric", "Velvet", "Leather", "Faux Leather", "Marble", "Stone", "Ceramic", "Concrete", "Rattan"];
export type MaterialType = (typeof ALLOWED_MATERIALS)[number];
export declare const ALLOWED_ROOM_TYPES: readonly ["living_room", "bedroom", "kids_room", "dining_room", "kitchen", "bathroom", "office", "game_room", "balcony"];
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
    externalId: z.ZodString;
    sellerId: z.ZodOptional<z.ZodString>;
    source: z.ZodObject<{
        marketplace: z.ZodString;
        sellerId: z.ZodOptional<z.ZodString>;
        productUrl: z.ZodString;
        country: z.ZodLiteral<"Egypt">;
        scrapedAt: z.ZodString;
        lastUpdated: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        marketplace: string;
        productUrl: string;
        country: "Egypt";
        scrapedAt: string;
        lastUpdated: string;
        sellerId?: string | undefined;
    }, {
        marketplace: string;
        productUrl: string;
        country: "Egypt";
        scrapedAt: string;
        lastUpdated: string;
        sellerId?: string | undefined;
    }>;
    basic: z.ZodObject<{
        name: z.ZodString;
        brand: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        sku: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        brand: string | null;
        description: string | null;
        sku: string | null;
    }, {
        name: string;
        brand: string | null;
        description: string | null;
        sku: string | null;
    }>;
    classification: z.ZodObject<{
        canonicalCategory: z.ZodString;
        roomTypes: z.ZodArray<z.ZodString, "many">;
        styles: z.ZodArray<z.ZodString, "many">;
        materials: z.ZodArray<z.ZodString, "many">;
        colors: z.ZodArray<z.ZodString, "many">;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        canonicalCategory: string;
        roomTypes: string[];
        styles: string[];
        materials: string[];
        colors: string[];
        tags: string[];
    }, {
        canonicalCategory: string;
        roomTypes: string[];
        styles: string[];
        materials: string[];
        colors: string[];
        tags: string[];
    }>;
    pricing: z.ZodObject<{
        currency: z.ZodLiteral<"EGP">;
        currentPrice: z.ZodNullable<z.ZodNumber>;
        originalPrice: z.ZodNullable<z.ZodNumber>;
        discountPercentage: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currency: "EGP";
        currentPrice: number | null;
        originalPrice: number | null;
        discountPercentage: number | null;
    }, {
        currency: "EGP";
        currentPrice: number | null;
        originalPrice: number | null;
        discountPercentage: number | null;
    }>;
    dimensions: z.ZodObject<{
        width: z.ZodNullable<z.ZodNumber>;
        height: z.ZodNullable<z.ZodNumber>;
        length: z.ZodNullable<z.ZodNumber>;
        dimensionUnit: z.ZodLiteral<"cm">;
        weight: z.ZodNullable<z.ZodNumber>;
        weightUnit: z.ZodLiteral<"kg">;
    }, "strip", z.ZodTypeAny, {
        length: number | null;
        width: number | null;
        height: number | null;
        weight: number | null;
        dimensionUnit: "cm";
        weightUnit: "kg";
    }, {
        length: number | null;
        width: number | null;
        height: number | null;
        weight: number | null;
        dimensionUnit: "cm";
        weightUnit: "kg";
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
        inStock: z.ZodNullable<z.ZodBoolean>;
        stockStatus: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        inStock: boolean | null;
        stockStatus: string | null;
    }, {
        inStock: boolean | null;
        stockStatus: string | null;
    }>;
    rating: z.ZodObject<{
        average: z.ZodNullable<z.ZodNumber>;
        reviews: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        average: number | null;
        reviews: number | null;
    }, {
        average: number | null;
        reviews: number | null;
    }>;
    ai: z.ZodObject<{
        embeddingText: z.ZodNullable<z.ZodString>;
        styleLabels: z.ZodArray<z.ZodString, "many">;
        dominantColors: z.ZodArray<z.ZodString, "many">;
        roomCompatibility: z.ZodArray<z.ZodString, "many">;
        keywords: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        embeddingText: string | null;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    }, {
        embeddingText: string | null;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    }>;
    processing: z.ZodObject<{
        status: z.ZodEnum<["ACCEPTED", "REVIEW", "REJECTED"]>;
        categoryConfidence: z.ZodNumber;
        qualityScore: z.ZodNumber;
        issues: z.ZodArray<z.ZodString, "many">;
        normalizationVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        status: "ACCEPTED" | "REVIEW" | "REJECTED";
        categoryConfidence: number;
        qualityScore: number;
        normalizationVersion: string;
    }, {
        issues: string[];
        status: "ACCEPTED" | "REVIEW" | "REJECTED";
        categoryConfidence: number;
        qualityScore: number;
        normalizationVersion: string;
    }>;
}, "strip", z.ZodTypeAny, {
    externalId: string;
    source: {
        marketplace: string;
        productUrl: string;
        country: "Egypt";
        scrapedAt: string;
        lastUpdated: string;
        sellerId?: string | undefined;
    };
    basic: {
        name: string;
        brand: string | null;
        description: string | null;
        sku: string | null;
    };
    classification: {
        canonicalCategory: string;
        roomTypes: string[];
        styles: string[];
        materials: string[];
        colors: string[];
        tags: string[];
    };
    pricing: {
        currency: "EGP";
        currentPrice: number | null;
        originalPrice: number | null;
        discountPercentage: number | null;
    };
    dimensions: {
        length: number | null;
        width: number | null;
        height: number | null;
        weight: number | null;
        dimensionUnit: "cm";
        weightUnit: "kg";
    };
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    availability: {
        inStock: boolean | null;
        stockStatus: string | null;
    };
    rating: {
        average: number | null;
        reviews: number | null;
    };
    ai: {
        embeddingText: string | null;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    };
    processing: {
        issues: string[];
        status: "ACCEPTED" | "REVIEW" | "REJECTED";
        categoryConfidence: number;
        qualityScore: number;
        normalizationVersion: string;
    };
    sellerId?: string | undefined;
}, {
    externalId: string;
    source: {
        marketplace: string;
        productUrl: string;
        country: "Egypt";
        scrapedAt: string;
        lastUpdated: string;
        sellerId?: string | undefined;
    };
    basic: {
        name: string;
        brand: string | null;
        description: string | null;
        sku: string | null;
    };
    classification: {
        canonicalCategory: string;
        roomTypes: string[];
        styles: string[];
        materials: string[];
        colors: string[];
        tags: string[];
    };
    pricing: {
        currency: "EGP";
        currentPrice: number | null;
        originalPrice: number | null;
        discountPercentage: number | null;
    };
    dimensions: {
        length: number | null;
        width: number | null;
        height: number | null;
        weight: number | null;
        dimensionUnit: "cm";
        weightUnit: "kg";
    };
    images: {
        url: string;
        isPrimary: boolean;
    }[];
    availability: {
        inStock: boolean | null;
        stockStatus: string | null;
    };
    rating: {
        average: number | null;
        reviews: number | null;
    };
    ai: {
        embeddingText: string | null;
        styleLabels: string[];
        dominantColors: string[];
        roomCompatibility: string[];
        keywords: string[];
    };
    processing: {
        issues: string[];
        status: "ACCEPTED" | "REVIEW" | "REJECTED";
        categoryConfidence: number;
        qualityScore: number;
        normalizationVersion: string;
    };
    sellerId?: string | undefined;
}>;
export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;
