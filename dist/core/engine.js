"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperEngine = void 0;
const http_js_1 = require("./http.js");
const checkpoint_js_1 = require("./checkpoint.js");
const deduplication_js_1 = require("../normalizers/deduplication.js");
const logger_js_1 = require("./logger.js");
const amazon_js_1 = require("../adapters/amazon.js");
const noon_js_1 = require("../adapters/noon.js");
const jumia_js_1 = require("../adapters/jumia.js");
const ikea_js_1 = require("../adapters/ikea.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ScraperEngine {
    adapters = new Map();
    httpClient;
    checkpoint;
    constructor(options = {}) {
        this.httpClient = new http_js_1.HttpClient(options.delayMs || 1000);
        this.checkpoint = new checkpoint_js_1.CheckpointManager(options.checkpointFile || '.checkpoint.json');
        // Register standard adapters
        this.registerAdapter(new amazon_js_1.AmazonAdapter(this.httpClient));
        this.registerAdapter(new noon_js_1.NoonAdapter(this.httpClient));
        this.registerAdapter(new jumia_js_1.JumiaAdapter(this.httpClient));
        this.registerAdapter(new ikea_js_1.IkeaAdapter(this.httpClient));
    }
    registerAdapter(adapter) {
        this.adapters.set(adapter.name.toLowerCase(), adapter);
        this.adapters.set(adapter.name, adapter);
    }
    getAvailableAdapters() {
        return Array.from(new Set(Array.from(this.adapters.values()).map((a) => a.name)));
    }
    async run(options = {}) {
        const targetAdapterNames = options.adapters && options.adapters.length > 0
            ? options.adapters
            : this.getAvailableAdapters();
        const limitPerCategory = options.limitPerCategory || 10;
        const outputFile = options.outputFile || 'products_catalog.json';
        logger_js_1.logger.info(`Starting ScraperEngine for adapters: ${targetAdapterNames.join(', ')}`);
        const scrapedProducts = options.resume ? [...this.checkpoint.getSavedProducts()] : [];
        for (const name of targetAdapterNames) {
            const adapter = this.adapters.get(name.toLowerCase()) || this.adapters.get(name);
            if (!adapter) {
                logger_js_1.logger.error(`Adapter not found: ${name}`);
                continue;
            }
            logger_js_1.logger.info(`=== Executing Scraper Adapter: ${adapter.name} ===`);
            try {
                const seeds = await adapter.getCategorySeeds();
                for (const seed of seeds) {
                    logger_js_1.logger.info(`Scraping category seed: ${seed.name} (${seed.url})`);
                    let page = 1;
                    let categoryProductCount = 0;
                    let hasNext = true;
                    while (hasNext && categoryProductCount < limitPerCategory) {
                        const pageResult = await adapter.scrapeCategoryPage(seed, page);
                        for (const prodUrl of pageResult.productUrls) {
                            if (categoryProductCount >= limitPerCategory)
                                break;
                            if (options.resume && this.checkpoint.isUrlScraped(adapter.name, prodUrl)) {
                                logger_js_1.logger.info(`Skipping already scraped URL (resume mode): ${prodUrl}`);
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
                                    logger_js_1.logger.info(`[${adapter.name}] Successfully scraped & normalized: "${unified.basic.name}"`);
                                }
                            }
                            catch (err) {
                                logger_js_1.logger.error(`Failed scraping product ${prodUrl}: ${err.message}`);
                            }
                        }
                        page++;
                        hasNext = pageResult.hasNextPage;
                    }
                }
            }
            catch (err) {
                logger_js_1.logger.error(`Error executing adapter ${adapter.name}: ${err.message}`);
            }
            this.checkpoint.save();
        }
        // Deduplicate across all marketplace sources
        logger_js_1.logger.info(`Deduplicating ${scrapedProducts.length} collected products...`);
        const finalCatalog = (0, deduplication_js_1.deduplicateProducts)(scrapedProducts);
        // Save final JSON catalog
        const resolvedPath = path_1.default.resolve(outputFile);
        fs_1.default.writeFileSync(resolvedPath, JSON.stringify(finalCatalog, null, 2), 'utf-8');
        logger_js_1.logger.info(`Saved final unified product catalog (${finalCatalog.length} unique products) to ${resolvedPath}`);
        return finalCatalog;
    }
}
exports.ScraperEngine = ScraperEngine;
