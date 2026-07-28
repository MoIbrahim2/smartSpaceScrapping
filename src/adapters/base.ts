import { IProviderScraper, RawScrapedProduct, DiscoveryResult } from '../types/adapter.js';
import { HttpClient } from '../core/http.js';
import { logger } from '../core/logger.js';

/**
 * BaseAdapter — Abstract base class for all provider scrapers.
 *
 * Provides:
 * - Shared HTTP client
 * - Default hasMoreResults() implementation
 *
 * Subclasses must implement:
 * - discover() — Search marketplace for a canonical category
 * - scrapeProduct() — Extract raw product data from a detail page
 */
export abstract class BaseAdapter implements IProviderScraper {
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  protected httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  abstract discover(
    category: string,
    searchTerms: string[],
    page: number,
    currentSearchTermIndex: number
  ): Promise<DiscoveryResult>;

  abstract scrapeProduct(url: string): Promise<RawScrapedProduct | null>;

  /**
   * Default: has more results if the last page returned candidates and page is under limit.
   */
  public hasMoreResults(
    category: string,
    page: number,
    lastResult: DiscoveryResult
  ): boolean {
    return lastResult.hasNextPage && lastResult.candidateUrls.length > 0 && page < 50;
  }
}
