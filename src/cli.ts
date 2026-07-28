#!/usr/bin/env node
import { Command } from 'commander';
import { CategoryOrchestrator } from './core/orchestrator.js';
import { logger } from './core/logger.js';

const program = new Command();

program
  .name('smartspace-scraper')
  .description('SmartSpaceAI Category-Driven Product Scraper v2.0')
  .version('2.0.0');

program
  .option('-c, --category <name>', 'Scrape a specific canonical category (e.g., "Sofa")')
  .option('-p, --provider <name>', 'Scrape from a specific provider only (e.g., "Amazon Egypt")')
  .option('-t, --target-per-provider <number>', 'Override target valid products per provider', (val) => parseInt(val, 10))
  .option('-a, --all', 'Scrape all canonical categories', false)
  .option('-r, --resume', 'Resume from previous checkpoint', false)
  .option('--list-categories', 'List all canonical categories and exit', false)
  .option('--dry-run', 'Validate the pipeline configuration without scraping', false)
  .action(async (options) => {
    try {
      const orchestrator = new CategoryOrchestrator();

      // List categories mode
      if (options.listCategories) {
        orchestrator.listCategories();
        process.exit(0);
      }

      // Validate options
      if (!options.category && !options.all) {
        logger.error('Please specify --category <name> or --all. Use --list-categories to see available categories.');
        process.exit(1);
      }

      // Dry run mode
      if (options.dryRun) {
        logger.info('Dry run mode — validating configuration...');
        const categories = orchestrator.getCanonicalCategories();
        logger.info(`✓ ${categories.length} categories loaded`);
        if (options.category) {
          if (!categories.includes(options.category)) {
            logger.error(`Category "${options.category}" not found in canonical taxonomy.`);
            process.exit(1);
          }
          logger.info(`✓ Category "${options.category}" found`);
        }
        logger.info('✓ Configuration valid. Ready to scrape.');
        process.exit(0);
      }

      logger.info('Initializing SmartSpaceAI Category-Driven Scraper v2.0...');

      const report = await orchestrator.scrapeAll({
        category: options.category,
        provider: options.provider,
        targetPerProvider: options.targetPerProvider,
        resume: options.resume,
        dryRun: options.dryRun,
      });

      logger.info(`\n${'═'.repeat(60)}`);
      logger.info(`  SCRAPING COMPLETE`);
      logger.info(`  Categories: ${report.totalCategories}`);
      logger.info(`  Total Valid Products: ${report.totalProducts}`);
      logger.info(`${'═'.repeat(60)}`);

      process.exit(0);
    } catch (err: any) {
      logger.error(`Fatal CLI execution error: ${err.message}`);
      if (err.stack) logger.error(err.stack);
      process.exit(1);
    }
  });

program.parse(process.argv);
