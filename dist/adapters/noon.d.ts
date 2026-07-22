import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
export declare class NoonAdapter extends BaseAdapter {
    readonly name = "Noon Egypt";
    readonly baseUrl = "https://www.noon.com/egypt-en";
    getCategorySeeds(): Promise<CategorySeed[]>;
    scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult>;
    scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
}
