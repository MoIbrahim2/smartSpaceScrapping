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
  .option('-l, --limit <number>', 'Product limit per category', (val) => parseInt(val, 10), 5)
  .option('-o, --output <path>', 'Output JSON file destination', 'products_catalog.json')
  .option('-r, --resume', 'Resume from previous checkpoint', false)
  .option('-d, --delay <ms>', 'Delay between HTTP requests in ms', (val) => parseInt(val, 10), 1000)
  .action(async (options) => {
    try {
      logger.info('Initializing SmartSpaceAI Product Scraper...');

      const engine = new ScraperEngine({ delayMs: options.delay });

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
