#!/usr/bin/env node
import { Command } from 'commander';
import { ScraperEngine } from './core/engine.js';
import { logger } from './core/logger.js';

const program = new Command();

program
  .name('smartspace-scraper')
  .description('SmartSpaceAI Modular Product Scraper CLI')
  .version('1.0.0');

program
  .option('-a, --adapter <name>', 'Specific adapter to run (amazon, noon, jumia, ikea, or all)', 'all')
  .option('-l, --limit <number>', 'Product limit per category seed', (val) => parseInt(val, 10), 500)
  .option('-o, --output <path>', 'Output JSON file destination', 'products_catalog.json')
  .option('-r, --resume', 'Resume from previous checkpoint', false)
  .option('-d, --delay <ms>', 'Delay between HTTP requests in ms', (val) => parseInt(val, 10), 300)
  .option('-t, --retries <number>', 'Max retries on failed requests (0 skips immediately)', (val) => parseInt(val, 10), 0)
  .option('--timeout <ms>', 'HTTP request timeout in ms', (val) => parseInt(val, 10), 15000)
  .action(async (options) => {
    try {
      logger.info(`Initializing SmartSpaceAI Scraper (retries=${options.retries}, timeout=${options.timeout}ms, delay=${options.delay}ms)...`);

      const engine = new ScraperEngine({
        delayMs: options.delay,
        maxRetries: options.retries,
        timeoutMs: options.timeout,
      });

      let targetAdapters: string[] = [];
      if (options.adapter.toLowerCase() !== 'all') {
        targetAdapters = [options.adapter];
      }

      const catalog = await engine.run({
        adapters: targetAdapters,
        limitPerCategory: options.limit,
        outputFile: options.output,
        resume: options.resume,
      });

      logger.info(`Done! Total unified products catalog size: ${catalog.length}`);
      process.exit(0);
    } catch (err: any) {
      logger.error(`Fatal CLI execution error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
