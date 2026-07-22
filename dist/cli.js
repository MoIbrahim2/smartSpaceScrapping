#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const engine_js_1 = require("./core/engine.js");
const logger_js_1 = require("./core/logger.js");
const program = new commander_1.Command();
program
    .name('smartspace-scraper')
    .description('SmartSpaceAI Modular Product Scraper CLI')
    .version('1.0.0');
program
    .option('-a, --adapter <name>', 'Specific adapter to run (amazon, noon, jumia, ikea, or all)', 'all')
    .option('-l, --limit <number>', 'Product limit per category', (val) => parseInt(val, 10), 10)
    .option('-o, --output <path>', 'Output JSON file destination', 'products_catalog.json')
    .option('-r, --resume', 'Resume from previous checkpoint', false)
    .option('-d, --delay <ms>', 'Delay between HTTP requests in ms', (val) => parseInt(val, 10), 500)
    .option('-t, --retries <number>', 'Max retries on failed requests (0 skips immediately)', (val) => parseInt(val, 10), 0)
    .option('--timeout <ms>', 'HTTP request timeout in ms', (val) => parseInt(val, 10), 5000)
    .action(async (options) => {
    try {
        logger_js_1.logger.info(`Initializing SmartSpaceAI Scraper (retries=${options.retries}, timeout=${options.timeout}ms, delay=${options.delay}ms)...`);
        const engine = new engine_js_1.ScraperEngine({
            delayMs: options.delay,
            maxRetries: options.retries,
            timeoutMs: options.timeout,
        });
        let targetAdapters = [];
        if (options.adapter.toLowerCase() !== 'all') {
            targetAdapters = [options.adapter];
        }
        const catalog = await engine.run({
            adapters: targetAdapters,
            limitPerCategory: options.limit,
            outputFile: options.output,
            resume: options.resume,
        });
        logger_js_1.logger.info(`Done! Total unified products catalog size: ${catalog.length}`);
        process.exit(0);
    }
    catch (err) {
        logger_js_1.logger.error(`Fatal CLI execution error: ${err.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);
