import { UnifiedProduct } from './schema.js';

// ─── Provider Scraper Contract ──────────────────────────────────────────

export interface DiscoveryResult {
  candidateUrls: string[];
  totalResultsHint?: number;
  hasNextPage: boolean;
  searchTermUsed: string;
}

export interface IProviderScraper {
  readonly name: string;
  readonly baseUrl: string;

  /**
   * Discover candidate product URLs for a specific canonical category.
   * Uses the provided search terms to query the marketplace.
   */
  discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult>;

  /**
   * Scrape a single product detail page and return raw extracted data.
   */
  scrapeProduct(url: string): Promise<RawScrapedProduct | null>;

  /**
   * Check if the provider may have more results for the current search.
   */
  hasMoreResults(
    category: string,
    page: number,
    lastResult: DiscoveryResult
  ): boolean;
}

// ─── Raw Scraped Product ────────────────────────────────────────────────

export interface RawScrapedProduct {
  externalId: string;
  marketplace: string;
  productUrl: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  sku?: string;
  rawCategory?: string;
  rawSubcategory?: string;
  rawStyle?: string;
  rawMaterial?: string;
  rawColor?: string;
  currentPrice: number | null;
  originalPrice?: number | null;
  currency?: string;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  weight?: number | null;
  images: string[];
  inStock?: boolean | null;
  stockStatus?: string;
  deliveryAvailable?: boolean;
  ratingAverage?: number | null;
  ratingReviews?: number | null;
  specifications?: Record<string, string>;
}

// ─── Category Scrape Progress ───────────────────────────────────────────

export interface CategoryScrapeProgress {
  category: string;
  provider: string;
  targetValidProducts: number;
  discovered: number;
  scraped: number;
  valid: number;
  invalid: number;
  duplicates: number;
  failedPages: number;
  retries: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'INCOMPLETE';
  reason?: string;
  startedAt?: string;
  completedAt?: string;
  lastSearchTermIndex?: number;
  lastPage?: number;
}

// ─── Category Result ────────────────────────────────────────────────────

export interface CategoryResult {
  category: string;
  target: number;
  valid: number;
  providers: Record<string, CategoryScrapeProgress>;
  status: 'COMPLETE' | 'INCOMPLETE';
}

// ─── Final Report ───────────────────────────────────────────────────────

export interface FinalReport {
  generatedAt: string;
  totalCategories: number;
  totalProducts: number;
  categories: CategoryResult[];
}

// ─── Orchestrator Options ───────────────────────────────────────────────

export interface OrchestratorOptions {
  category?: string;
  provider?: string;
  targetPerProvider?: number;
  resume?: boolean;
  dryRun?: boolean;
}

// ─── Validation Result ──────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  reasons: string[];
  canonicalCategory: string;
  confidence: number;
  qualityScore: number;
}
