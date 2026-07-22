export interface CategoryMapping {
    category: string;
    subcategory: string;
    defaultRoom: string;
}
export declare function isFurnishingProduct(name: string, rawCategory?: string): boolean;
export declare function normalizeCategory(rawName: string, rawCategory?: string): CategoryMapping;
