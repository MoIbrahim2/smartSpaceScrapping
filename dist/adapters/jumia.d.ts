import { BaseAdapter } from './base.js';
import { CategorySeed, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
export declare class JumiaAdapter extends BaseAdapter {
    readonly name = "Jumia Egypt";
    readonly baseUrl = "https://www.jumia.com.eg";
    getCategorySeeds(): Promise<CategorySeed[]>;
    scrapeCategoryPage(seed: CategorySeed, page: number): Promise<ScrapePageResult>;
    scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
}
