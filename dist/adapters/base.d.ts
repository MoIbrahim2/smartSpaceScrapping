import { CategorySeed, IScraperAdapter, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { UnifiedProduct } from '../types/schema.js';
import { HttpClient } from '../core/http.js';
export declare abstract class BaseAdapter implements IScraperAdapter {
    abstract readonly name: string;
    abstract readonly baseUrl: string;
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient);
    abstract getCategorySeeds(): Promise<CategorySeed[]>;
    abstract scrapeCategoryPage(categorySeed: CategorySeed, page: number): Promise<ScrapePageResult>;
    abstract scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
    transform(raw: RawScrapedProduct): UnifiedProduct;
}
