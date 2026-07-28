import fs from 'fs';
import path from 'path';
import { FinalReport, CategoryResult } from '../types/adapter.js';
import { logger } from './logger.js';

/**
 * ReportGenerator — Generates JSON and Markdown scraping reports.
 */
export class ReportGenerator {
  /**
   * Generate both JSON and Markdown reports from a FinalReport.
   */
  public generate(report: FinalReport): void {
    const reportsDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    // JSON report
    const jsonPath = path.join(reportsDir, 'scraping-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

    // Markdown report
    const mdPath = path.join(reportsDir, 'scraping-report.md');
    fs.writeFileSync(mdPath, this.renderMarkdown(report), 'utf-8');

    logger.info(`\n✓ Reports generated:`);
    logger.info(`  → ${jsonPath}`);
    logger.info(`  → ${mdPath}`);
  }

  private renderMarkdown(report: FinalReport): string {
    const lines: string[] = [];

    lines.push('# SmartSpaceAI Scraping Report');
    lines.push('');
    lines.push(`**Generated:** ${report.generatedAt}`);
    lines.push(`**Total Categories:** ${report.totalCategories}`);
    lines.push(`**Total Valid Products:** ${report.totalProducts}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Coverage Matrix
    lines.push('## Coverage Matrix');
    lines.push('');

    // Collect all provider names
    const allProviders = new Set<string>();
    for (const cat of report.categories) {
      for (const p of Object.keys(cat.providers)) {
        allProviders.add(p);
      }
    }
    const providerList = Array.from(allProviders).sort();

    // Table header
    const headerCols = ['Category', ...providerList.map((p) => this.shortName(p)), 'Total', 'Status'];
    lines.push(`| ${headerCols.join(' | ')} |`);
    lines.push(`| ${headerCols.map(() => ':---').join(' | ')} |`);

    // Table rows
    for (const cat of report.categories) {
      const row: string[] = [cat.category];
      for (const p of providerList) {
        const progress = cat.providers[p];
        if (progress) {
          const status = progress.status === 'COMPLETE' ? '✅' : '⚠️';
          row.push(`${progress.valid}/${progress.targetValidProducts} ${status}`);
        } else {
          row.push('—');
        }
      }
      row.push(`${cat.valid}`);
      row.push(cat.status === 'COMPLETE' ? '✅ COMPLETE' : '⚠️ INCOMPLETE');
      lines.push(`| ${row.join(' | ')} |`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // Per-category details
    lines.push('## Category Details');
    lines.push('');

    for (const cat of report.categories) {
      lines.push(`### ${cat.category}`);
      lines.push('');
      lines.push(`- **Target:** ${cat.target} | **Achieved:** ${cat.valid} | **Status:** ${cat.status}`);
      lines.push('');

      for (const [provName, progress] of Object.entries(cat.providers)) {
        const icon = progress.status === 'COMPLETE' ? '✅' : progress.status === 'INCOMPLETE' ? '⚠️' : '🔄';
        lines.push(`**${provName}** ${icon}`);
        lines.push(`- Valid: ${progress.valid}/${progress.targetValidProducts}`);
        lines.push(`- Discovered: ${progress.discovered} | Scraped: ${progress.scraped}`);
        lines.push(`- Rejected: ${progress.invalid} | Duplicates: ${progress.duplicates}`);
        if (progress.reason) {
          lines.push(`- Reason: ${progress.reason}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Summary statistics
    lines.push('## Summary Statistics');
    lines.push('');

    const completeCategories = report.categories.filter((c) => c.status === 'COMPLETE').length;
    const incompleteCategories = report.categories.filter((c) => c.status === 'INCOMPLETE').length;

    lines.push(`| Metric | Value |`);
    lines.push(`| :--- | :--- |`);
    lines.push(`| Total categories scraped | ${report.totalCategories} |`);
    lines.push(`| Categories COMPLETE | ${completeCategories} |`);
    lines.push(`| Categories INCOMPLETE | ${incompleteCategories} |`);
    lines.push(`| Total valid products | ${report.totalProducts} |`);
    lines.push('');

    return lines.join('\n');
  }

  private shortName(provider: string): string {
    return provider.replace(' Egypt', '');
  }
}
