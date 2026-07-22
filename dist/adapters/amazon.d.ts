import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
export declare class AmazonAdapter extends BaseAdapter {
    readonly name = "Amazon Egypt";
    readonly baseUrl = "https://www.amazon.eg";
    getCategorySeeds(): Promise<CategorySeed[]>;
    scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult>;
    scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
}
