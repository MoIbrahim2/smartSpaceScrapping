import { UnifiedProduct } from './schema.js';

export interface CategorySeed {
  name: string;
  url: string;
  targetRoom?: string;
}

export interface RawScrapedProduct {
  externalId: string;
  marketplace: string;
  productUrl: string;
  name: string;
  brand?: string;
  description?: string;
  sku?: string;
  rawCategory?: string;
  rawSubcategory?: string;
  rawStyle?: string;
  rawMaterial?: string;
  rawColor?: string;
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  weight?: number | null;
  images: string[];
  inStock?: boolean;
  stockStatus?: string;
  deliveryAvailable?: boolean;
  ratingAverage?: number;
  ratingReviews?: number;
  specifications?: Record<string, string>;
}

export interface ScrapePageResult {
  productUrls: string[];
  hasNextPage: boolean;
  nextPageUrl?: string;
}

export interface IScraperAdapter {
  readonly name: string;
  readonly baseUrl: string;
  getCategorySeeds(): Promise<CategorySeed[]>;
  scrapeCategoryPage(categorySeed: CategorySeed, page: number): Promise<ScrapePageResult>;
  scrapeProduct(url: string): Promise<RawScrapedProduct | null>;
  transform(raw: RawScrapedProduct): UnifiedProduct;
}

export interface ScraperEngineOptions {
  adapters?: string[];
  limitPerCategory?: number;
  concurrency?: number;
  delayMs?: number;
  outputFile?: string;
  resume?: boolean;
}
