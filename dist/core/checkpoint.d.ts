import { UnifiedProduct } from '../types/schema.js';
export interface CheckpointData {
    lastUpdated: string;
    scrapedUrls: Record<string, string[]>;
    completedCategories: Record<string, string[]>;
    savedProducts: UnifiedProduct[];
}
export declare class CheckpointManager {
    private filePath;
    private data;
    constructor(filePath?: string);
    private load;
    save(): void;
    isUrlScraped(adapterName: string, url: string): boolean;
    markUrlScraped(adapterName: string, url: string): void;
    addProduct(product: UnifiedProduct): void;
    getSavedProducts(): UnifiedProduct[];
    clear(): void;
}
