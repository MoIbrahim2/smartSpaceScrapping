import { IScraperAdapter, ScraperEngineOptions } from '../types/adapter.js';
import { UnifiedProduct } from '../types/schema.js';
import { HttpClient } from './http.js';
import { CheckpointManager } from './checkpoint.js';
import { deduplicateProducts } from '../normalizers/deduplication.js';
import { logger } from './logger.js';
import { AmazonAdapter } from '../adapters/amazon.js';
import { NoonAdapter } from '../adapters/noon.js';
import { JumiaAdapter } from '../adapters/jumia.js';
import { IkeaAdapter } from '../adapters/ikea.js';
import fs from 'fs';
import path from 'path';

export class ScraperEngine {
  private adapters: Map<string, IScraperAdapter> = new Map();
  private httpClient: HttpClient;
  private checkpoint: CheckpointManager;

  constructor(options: { delayMs?: number; maxRetries?: number; timeoutMs?: number; checkpointFile?: string } = {}) {
    this.httpClient = new HttpClient(
      options.delayMs ?? 500,
      options.maxRetries ?? 0,
      options.timeoutMs ?? 6000
    );
    this.checkpoint = new CheckpointManager(options.checkpointFile || '.checkpoint.json');

    // Register standard adapters
    this.registerAdapter(new AmazonAdapter(this.httpClient));
    this.registerAdapter(new NoonAdapter(this.httpClient));
    this.registerAdapter(new JumiaAdapter(this.httpClient));
    this.registerAdapter(new IkeaAdapter(this.httpClient));
  }

  public registerAdapter(adapter: IScraperAdapter): void {
    this.adapters.set(adapter.name.toLowerCase(), adapter);
    this.adapters.set(adapter.name, adapter);
  }

  public getAvailableAdapters(): string[] {
    return Array.from(new Set(Array.from(this.adapters.values()).map((a) => a.name)));
  }

  public async run(options: ScraperEngineOptions = {}): Promise<UnifiedProduct[]> {
    const targetAdapterNames = options.adapters && options.adapters.length > 0
      ? options.adapters
      : this.getAvailableAdapters();

    const limitPerCategory = options.limitPerCategory || 10;
    const outputFile = options.outputFile || 'products_catalog.json';

    logger.info(`Starting ScraperEngine for adapters: ${targetAdapterNames.join(', ')}`);

    const scrapedProducts: UnifiedProduct[] = options.resume ? [...this.checkpoint.getSavedProducts()] : [];

    for (const name of targetAdapterNames) {
      const adapter = this.adapters.get(name.toLowerCase()) || this.adapters.get(name);
      if (!adapter) {
        logger.error(`Adapter not found: ${name}`);
        continue;
      }

      logger.info(`=== Executing Scraper Adapter: ${adapter.name} ===`);
      try {
        const seeds = await adapter.getCategorySeeds();
        for (const seed of seeds) {
          logger.info(`Scraping category seed: ${seed.name} (${seed.url})`);
          let page = 1;
          let categoryProductCount = 0;
          let hasNext = true;

          while (hasNext && categoryProductCount < limitPerCategory) {
            const pageResult = await adapter.scrapeCategoryPage(seed, page);
            
            for (const prodUrl of pageResult.productUrls) {
              if (categoryProductCount >= limitPerCategory) break;

              if (options.resume && this.checkpoint.isUrlScraped(adapter.name, prodUrl)) {
                logger.info(`Skipping already scraped URL (resume mode): ${prodUrl}`);
                continue;
              }

              try {
                const rawProduct = await adapter.scrapeProduct(prodUrl);
                if (rawProduct) {
                  const unified = adapter.transform(rawProduct);
                  scrapedProducts.push(unified);
                  this.checkpoint.addProduct(unified);
                  this.checkpoint.markUrlScraped(adapter.name, prodUrl);
                  categoryProductCount++;
                  logger.info(`[${adapter.name}] Successfully scraped & normalized: "${unified.basic.name}"`);
                }
              } catch (err: any) {
                logger.error(`Failed scraping product ${prodUrl}: ${err.message}`);
              }
            }

            page++;
            hasNext = pageResult.hasNextPage;
          }
        }
      } catch (err: any) {
        logger.error(`Error executing adapter ${adapter.name}: ${err.message}`);
      }

      this.checkpoint.save();
    }

    // Deduplicate across all marketplace sources
    logger.info(`Deduplicating ${scrapedProducts.length} collected products...`);
    const finalCatalog = deduplicateProducts(scrapedProducts);

    // Save final JSON catalog
    const resolvedPath = path.resolve(outputFile);
    fs.writeFileSync(resolvedPath, JSON.stringify(finalCatalog, null, 2), 'utf-8');
    logger.info(`Saved final unified product catalog (${finalCatalog.length} unique products) to ${resolvedPath}`);

    return finalCatalog;
  }
}
