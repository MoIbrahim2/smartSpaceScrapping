import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
export declare class IkeaAdapter extends BaseAdapter {
    readonly name = "IKEA Egypt";
    readonly baseUrl = "https://www.ikea.com/eg/ar";
    getCategorySeeds(): Promise<CategorySeed[]>;
    scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult>;
    scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
}
