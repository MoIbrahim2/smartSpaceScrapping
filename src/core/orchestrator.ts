import fs from 'fs';
import path from 'path';
import {
  IProviderScraper,
  RawScrapedProduct,
  CategoryScrapeProgress,
  CategoryResult,
  FinalReport,
  OrchestratorOptions,
} from '../types/adapter.js';
import { UnifiedProduct, UnifiedProductSchema } from '../types/schema.js';
import { HttpClient } from './http.js';
import { CheckpointManager } from './checkpoint.js';
import { ProductValidator } from './validator.js';
import { ReportGenerator } from './reporter.js';
import { normalizeCategory } from '../normalizers/category.js';
import { normalizeStyles } from '../normalizers/style.js';
import { normalizeColors } from '../normalizers/color.js';
import { normalizeMaterials } from '../normalizers/material.js';
import { inferRoomTypes } from '../normalizers/room.js';
import { extractDimensions } from '../normalizers/dimensions.js';
import { enrichProductAI } from '../normalizers/aiEnrichment.js';
import { deduplicateProducts } from '../normalizers/deduplication.js';
import { classifyProduct } from '../normalizers/relevanceClassifier.js';
import { calculateQualityScore } from '../normalizers/qualityScorer.js';
import { logger } from './logger.js';

import { AmazonAdapter } from '../adapters/amazon.js';
import { NoonAdapter } from '../adapters/noon.js';
import { JumiaAdapter } from '../adapters/jumia.js';
import { IkeaAdapter } from '../adapters/ikea.js';

const configPath = path.join(process.cwd(), 'config/scraper-config.json');
const aliasesPath = path.join(process.cwd(), 'config/category-aliases.json');

interface ScraperConfig {
  targetValidProductsPerProvider: number;
  nicheTargetTotalProducts: number;
  providers: string[];
  priorityCategories: string[];
  nicheCategories: string[];
  retryLimits: {
    maxPagesPerSearchTerm: number;
    maxConsecutiveEmptyPages: number;
    maxHttpRetries: number;
    maxTotalPagesPerProvider: number;
  };
  requestDelayMs: number;
  concurrency: number;
  validation: {
    requirePrice: boolean;
    minPrice: number;
    requireImage: boolean;
    requireProductUrl: boolean;
    minQualityScore: number;
    minNameLength: number;
  };
  checkpointSaveIntervalProducts: number;
}

/**
 * CategoryOrchestrator — The central coordinator for the category-driven pipeline.
 *
 * Flow: For each category → for each provider → discover → scrape → validate → normalize → save
 */
export class CategoryOrchestrator {
  private config: ScraperConfig;
  private aliases: Record<string, any>;
  private providers: Map<string, IProviderScraper> = new Map();
  private checkpoint: CheckpointManager;
  private validator: ProductValidator;
  private reporter: ReportGenerator;
  private httpClient: HttpClient;

  constructor() {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));

    this.httpClient = new HttpClient(
      this.config.requestDelayMs,
      this.config.retryLimits.maxHttpRetries,
      15000
    );

    this.checkpoint = new CheckpointManager('.checkpoint.json');
    this.validator = new ProductValidator();
    this.reporter = new ReportGenerator();

    // Register providers
    const amazon = new AmazonAdapter(this.httpClient);
    const noon = new NoonAdapter(this.httpClient);
    const jumia = new JumiaAdapter(this.httpClient);
    const ikea = new IkeaAdapter(this.httpClient);

    this.providers.set(amazon.name, amazon);
    this.providers.set(noon.name, noon);
    this.providers.set(jumia.name, jumia);
    this.providers.set(ikea.name, ikea);
  }

  /**
   * Get all canonical categories in execution order.
   */
  public getCanonicalCategories(): string[] {
    return [...this.config.priorityCategories, ...this.config.nicheCategories];
  }

  /**
   * Get the target per provider for a given category.
   */
  private getTargetPerProvider(category: string): number {
    if (this.config.nicheCategories.includes(category)) {
      // Niche categories: 30 total across all providers
      const providerCount = this.config.providers.length;
      return Math.ceil(this.config.nicheTargetTotalProducts / providerCount);
    }
    return this.config.targetValidProductsPerProvider;
  }

  /**
   * Scrape all categories sequentially.
   */
  public async scrapeAll(options: OrchestratorOptions = {}): Promise<FinalReport> {
    const categories = this.getCanonicalCategories();
    const results: CategoryResult[] = [];

    logger.info(`\n${'═'.repeat(70)}`);
    logger.info(`  SmartSpaceAI Category-Driven Scraper v2.0`);
    logger.info(`  Categories: ${categories.length} | Providers: ${this.config.providers.length}`);
    logger.info(`  Priority target: ${this.config.targetValidProductsPerProvider}/provider`);
    logger.info(`  Niche target: ${this.config.nicheTargetTotalProducts} total`);
    logger.info(`${'═'.repeat(70)}\n`);

    for (const category of categories) {
      if (options.category && options.category !== category) continue;
      const result = await this.scrapeCategory(category, options);
      results.push(result);
    }

    // Merge all outputs into catalog.json
    this.mergeOutputs(results);

    // Generate reports
    const report: FinalReport = {
      generatedAt: new Date().toISOString(),
      totalCategories: results.length,
      totalProducts: results.reduce((sum, r) => sum + r.valid, 0),
      categories: results,
    };

    this.reporter.generate(report);

    return report;
  }

  /**
   * Scrape a single canonical category across all providers.
   */
  public async scrapeCategory(
    category: string,
    options: OrchestratorOptions = {}
  ): Promise<CategoryResult> {
    const targetPerProvider = options.targetPerProvider || this.getTargetPerProvider(category);
    const providerNames = options.provider
      ? [options.provider]
      : this.config.providers;

    const isNiche = this.config.nicheCategories.includes(category);

    logger.info(`\n${'─'.repeat(60)}`);
    logger.info(`  CATEGORY: ${category} ${isNiche ? '(NICHE)' : '(PRIORITY)'}`);
    logger.info(`  Target: ${targetPerProvider} per provider`);
    logger.info(`  Providers: ${providerNames.join(', ')}`);
    logger.info(`${'─'.repeat(60)}`);

    const providerResults: Record<string, CategoryScrapeProgress> = {};
    let totalValid = 0;

    for (const providerName of providerNames) {
      // Check checkpoint for resume
      if (options.resume && this.checkpoint.isProviderComplete(category, providerName)) {
        const existingProgress = this.checkpoint.getProgress(category, providerName)!;
        logger.info(`  [${providerName}] Already complete (${existingProgress.valid} valid). Skipping.`);
        providerResults[providerName] = existingProgress;
        totalValid += existingProgress.valid;
        continue;
      }

      const provider = this.providers.get(providerName);
      if (!provider) {
        logger.warn(`  Provider "${providerName}" not found. Skipping.`);
        continue;
      }

      const searchTerms = this.aliases[category]?.searchTerms?.[providerName] || [];
      if (searchTerms.length === 0) {
        logger.warn(`  [${providerName}] No search terms configured for "${category}". Skipping.`);
        providerResults[providerName] = {
          category,
          provider: providerName,
          targetValidProducts: targetPerProvider,
          discovered: 0,
          scraped: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0,
          failedPages: 0,
          retries: 0,
          status: 'INCOMPLETE',
          reason: 'No search terms configured',
        };
        continue;
      }

      const progress = await this.scrapeCategoryProvider(
        category,
        provider,
        searchTerms,
        targetPerProvider,
        options
      );

      providerResults[providerName] = progress;
      totalValid += progress.valid;
    }

    const totalTarget = targetPerProvider * providerNames.length;
    const result: CategoryResult = {
      category,
      target: totalTarget,
      valid: totalValid,
      providers: providerResults,
      status: totalValid >= totalTarget ? 'COMPLETE' : 'INCOMPLETE',
    };

    logger.info(
      `  ✓ ${category} complete: ${totalValid}/${totalTarget} valid products`
    );

    return result;
  }

  /**
   * Scrape a single category from a single provider until quota is met or exhausted.
   */
  private async scrapeCategoryProvider(
    category: string,
    provider: IProviderScraper,
    searchTerms: string[],
    target: number,
    options: OrchestratorOptions = {}
  ): Promise<CategoryScrapeProgress> {
    const startedAt = new Date().toISOString();

    // Resume existing progress if available
    let progress: CategoryScrapeProgress = this.checkpoint.getProgress(category, provider.name) || {
      category,
      provider: provider.name,
      targetValidProducts: target,
      discovered: 0,
      scraped: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      failedPages: 0,
      retries: 0,
      status: 'NOT_STARTED',
      startedAt,
      lastSearchTermIndex: 0,
      lastPage: 0,
    };

    if (progress.status === 'COMPLETE' || progress.status === 'INCOMPLETE') {
      return progress;
    }

    progress.status = 'IN_PROGRESS';
    progress.startedAt = progress.startedAt || startedAt;

    // Ensure output directory exists
    const categorySlug = category.toLowerCase().replace(/\s+/g, '_');
    const outputDir = path.join(process.cwd(), 'output', 'categories', categorySlug);
    fs.mkdirSync(outputDir, { recursive: true });

    // Load existing products for this provider (for append on resume)
    const providerOutputFile = path.join(outputDir, `${this.providerSlug(provider.name)}.json`);
    let validProducts: UnifiedProduct[] = [];
    if (options.resume && fs.existsSync(providerOutputFile)) {
      try {
        validProducts = JSON.parse(fs.readFileSync(providerOutputFile, 'utf-8'));
      } catch {
        validProducts = [];
      }
    }

    // Collect seen external IDs for dedup within this provider+category
    const seenIds = new Set<string>(validProducts.map((p) => p.externalId));

    const startSearchTermIndex = options.resume ? (progress.lastSearchTermIndex || 0) : 0;
    let totalPagesScraped = 0;

    logger.info(`    [${provider.name}] Starting (target: ${target}, valid so far: ${progress.valid})`);

    for (let sti = startSearchTermIndex; sti < searchTerms.length; sti++) {
      if (progress.valid >= target) break;

      const searchTerm = searchTerms[sti];
      let page = (options.resume && sti === startSearchTermIndex) ? (progress.lastPage || 1) : 1;
      let consecutiveEmptyPages = 0;

      logger.info(`    [${provider.name}] Search term: "${searchTerm}" (page ${page})`);

      while (
        progress.valid < target &&
        page <= this.config.retryLimits.maxPagesPerSearchTerm &&
        totalPagesScraped < this.config.retryLimits.maxTotalPagesPerProvider
      ) {
        try {
          const discoveryResult = await provider.discover(category, searchTerms, page, sti);
          const candidates = discoveryResult.candidateUrls;

          progress.discovered += candidates.length;

          if (candidates.length === 0) {
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= this.config.retryLimits.maxConsecutiveEmptyPages) {
              logger.info(`    [${provider.name}] ${consecutiveEmptyPages} empty pages. Moving to next search term.`);
              break;
            }
            page++;
            totalPagesScraped++;
            continue;
          }

          consecutiveEmptyPages = 0;

          for (const url of candidates) {
            if (progress.valid >= target) break;

            // Skip already scraped URLs
            if (this.checkpoint.isUrlScraped(category, provider.name, url)) {
              continue;
            }

            try {
              const raw = await provider.scrapeProduct(url);
              progress.scraped++;
              this.checkpoint.markUrlScraped(category, provider.name, url);

              if (!raw) {
                progress.invalid++;
                continue;
              }

              // Validate against target category
              const validation = this.validator.validate(raw, category);

              if (!validation.isValid) {
                progress.invalid++;
                logger.info(
                  `    [${provider.name}] REJECTED "${raw.name?.substring(0, 40)}..." → ${validation.reasons[0]}`
                );
                continue;
              }

              // Check for duplicates
              if (seenIds.has(raw.externalId)) {
                progress.duplicates++;
                continue;
              }

              // Normalize to UnifiedProduct
              const normalized = this.normalizeProduct(raw, category, provider.name);
              if (!normalized) {
                progress.invalid++;
                continue;
              }

              // Schema validation
              const schemaResult = UnifiedProductSchema.safeParse(normalized);
              if (!schemaResult.success) {
                progress.invalid++;
                logger.warn(
                  `    [${provider.name}] Schema validation failed: ${schemaResult.error.message.substring(0, 100)}`
                );
                continue;
              }

              // Accept the product
              seenIds.add(raw.externalId);
              validProducts.push(schemaResult.data);
              progress.valid++;

              logger.info(
                `    [${provider.name}] ✓ ACCEPTED [${progress.valid}/${target}] "${raw.name?.substring(0, 50)}"`
              );

              // Periodic checkpoint save
              if (progress.valid % this.config.checkpointSaveIntervalProducts === 0) {
                progress.lastSearchTermIndex = sti;
                progress.lastPage = page;
                this.checkpoint.setProgress(category, provider.name, progress);
                this.checkpoint.save();
                // Also save products
                fs.writeFileSync(providerOutputFile, JSON.stringify(validProducts, null, 2), 'utf-8');
              }
            } catch (err: any) {
              progress.retries++;
              logger.warn(`    [${provider.name}] Scrape error for ${url}: ${err.message}`);
            }
          }

          page++;
          totalPagesScraped++;

          if (!discoveryResult.hasNextPage) break;
        } catch (err: any) {
          progress.failedPages++;
          logger.warn(`    [${provider.name}] Discovery page error: ${err.message}`);
          page++;
          totalPagesScraped++;
        }
      }
    }

    // Finalize
    progress.status = progress.valid >= target ? 'COMPLETE' : 'INCOMPLETE';
    if (progress.status === 'INCOMPLETE') {
      progress.reason = `Provider exhausted after ${totalPagesScraped} pages. Got ${progress.valid}/${target} valid products.`;
    }
    progress.completedAt = new Date().toISOString();

    // Save final output for this provider + category
    fs.writeFileSync(providerOutputFile, JSON.stringify(validProducts, null, 2), 'utf-8');

    // Save checkpoint
    this.checkpoint.setProgress(category, provider.name, progress);
    this.checkpoint.save();

    // Save _meta.json
    const metaFile = path.join(outputDir, '_meta.json');
    let meta: Record<string, CategoryScrapeProgress> = {};
    if (fs.existsSync(metaFile)) {
      try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8')); } catch { /* ignore */ }
    }
    meta[provider.name] = progress;
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf-8');

    logger.info(
      `    [${provider.name}] Done: ${progress.valid}/${target} valid | ` +
      `${progress.scraped} scraped | ${progress.invalid} rejected | ${progress.duplicates} dupes | ` +
      `Status: ${progress.status}`
    );

    return progress;
  }

  /**
   * Normalize a raw scraped product into a UnifiedProduct.
   */
  private normalizeProduct(
    raw: RawScrapedProduct,
    targetCategory: string,
    providerName: string
  ): UnifiedProduct | null {
    try {
      const rawName = raw.name || 'Untitled';
      const rawDesc = raw.description || '';
      const combinedText = `${rawName} ${rawDesc} ${raw.rawCategory || ''} ${raw.rawStyle || ''} ${raw.rawMaterial || ''} ${raw.rawColor || ''}`;

      // Attribute normalization
      const styles = normalizeStyles(combinedText, targetCategory);
      const colors = normalizeColors(combinedText);
      const materials = normalizeMaterials(combinedText);
      const roomTypes = inferRoomTypes(targetCategory, combinedText);

      // Dimensions extraction (NO silent fallback)
      const extractedDims = extractDimensions(
        raw.specifications || {},
        rawName,
        rawDesc,
        targetCategory
      );

      // AI enrichment
      const aiData = enrichProductAI(
        rawName,
        rawDesc,
        raw.brand || providerName,
        targetCategory,
        styles,
        colors,
        materials,
        roomTypes
      );

      // Images — filter out placeholders
      const formattedImages = (raw.images || [])
        .filter((url) => url && url.startsWith('http') && !url.toLowerCase().includes('placeholder'))
        .map((imgUrl, index) => ({
          url: imgUrl,
          isPrimary: index === 0,
        }));

      if (formattedImages.length === 0) {
        logger.warn(`    No valid images for "${rawName.substring(0, 40)}"`);
        return null;
      }

      // Pricing — no fabrication
      const curPrice = raw.currentPrice || 0;
      const origPrice = raw.originalPrice || curPrice;
      const discount = origPrice > curPrice && origPrice > 0
        ? Math.round(((origPrice - curPrice) / origPrice) * 100)
        : 0;

      // Quality scoring
      const mockForQuality = {
        basic: { name: rawName, brand: raw.brand, description: rawDesc, sku: raw.sku },
        pricing: { currentPrice: curPrice },
        images: formattedImages,
        dimensions: { width: extractedDims.width, height: extractedDims.height, length: extractedDims.depth, weight: extractedDims.weight },
        classification: { material: materials, colors },
        source: { productUrl: raw.productUrl },
      };
      const qualityResult = calculateQualityScore(mockForQuality, targetCategory);

      // Relevance classification (for confidence)
      const classification = classifyProduct(rawName, raw.rawCategory || '', rawDesc, raw.specifications || {});

      const nowIso = new Date().toISOString();

      const product: UnifiedProduct = {
        externalId: raw.externalId,
        source: {
          marketplace: providerName,
          country: 'Egypt',
          productUrl: raw.productUrl,
          scrapedAt: nowIso,
          lastUpdated: nowIso,
        },
        basic: {
          name: rawName,
          brand: raw.brand || null,
          description: rawDesc || null,
          sku: raw.sku || raw.externalId,
        },
        classification: {
          canonicalCategory: targetCategory,
          roomTypes,
          styles,
          materials,
          colors,
          tags: [targetCategory, ...styles, ...colors],
        },
        pricing: {
          currency: 'EGP',
          currentPrice: curPrice > 0 ? curPrice : null,
          originalPrice: origPrice > 0 ? origPrice : null,
          discountPercentage: discount,
        },
        dimensions: {
          width: extractedDims.width,
          height: extractedDims.height,
          length: extractedDims.depth,
          dimensionUnit: 'cm',
          weight: extractedDims.weight,
          weightUnit: 'kg',
        },
        images: formattedImages,
        availability: {
          inStock: raw.inStock ?? null,
          stockStatus: raw.stockStatus || null,
        },
        rating: {
          average: raw.ratingAverage ?? null,
          reviews: raw.ratingReviews ?? null,
        },
        ai: aiData,
        processing: {
          status: classification.status === 'REVIEW' ? 'REVIEW' : 'ACCEPTED',
          categoryConfidence: classification.confidence,
          qualityScore: qualityResult.score,
          issues: qualityResult.issues,
          normalizationVersion: '2.0',
        },
      };

      return product;
    } catch (err: any) {
      logger.error(`    Normalization error: ${err.message}`);
      return null;
    }
  }

  /**
   * Merge all category outputs into a single catalog.json.
   */
  private mergeOutputs(results: CategoryResult[]): void {
    const allProducts: UnifiedProduct[] = [];
    const categoriesDir = path.join(process.cwd(), 'output', 'categories');

    if (!fs.existsSync(categoriesDir)) return;

    const categoryDirs = fs.readdirSync(categoriesDir);
    for (const catDir of categoryDirs) {
      const catPath = path.join(categoriesDir, catDir);
      if (!fs.statSync(catPath).isDirectory()) continue;

      const jsonFiles = fs.readdirSync(catPath).filter((f) => f.endsWith('.json') && f !== '_meta.json');
      for (const jsonFile of jsonFiles) {
        try {
          const products: UnifiedProduct[] = JSON.parse(
            fs.readFileSync(path.join(catPath, jsonFile), 'utf-8')
          );
          allProducts.push(...products);
        } catch {
          // skip invalid files
        }
      }
    }

    // Final deduplication
    const deduped = deduplicateProducts(allProducts);
    const catalogPath = path.join(process.cwd(), 'output', 'catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(deduped, null, 2), 'utf-8');
    logger.info(`\n✓ Merged catalog: ${deduped.length} unique products → output/catalog.json`);
  }

  /**
   * List all canonical categories with their tier.
   */
  public listCategories(): void {
    console.log('\n═══ SmartSpaceAI Canonical Categories ═══\n');

    console.log('PRIORITY (target: 20/provider = 80 total):');
    for (const cat of this.config.priorityCategories) {
      const termCount = Object.values(this.aliases[cat]?.searchTerms || {}).flat().length;
      console.log(`  • ${cat} (${termCount} search terms total)`);
    }

    console.log(`\nNICHE (target: 30 total across all providers):`);
    for (const cat of this.config.nicheCategories) {
      const termCount = Object.values(this.aliases[cat]?.searchTerms || {}).flat().length;
      console.log(`  • ${cat} (${termCount} search terms total)`);
    }

    console.log(`\nTotal: ${this.config.priorityCategories.length + this.config.nicheCategories.length} categories`);
  }

  private providerSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '_');
  }
}
