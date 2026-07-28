import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { CategoryScrapeProgress } from '../types/adapter.js';

export interface CheckpointData {
  lastUpdated: string;
  version: string;
  progress: Record<string, Record<string, CategoryScrapeProgress>>;
  scrapedUrls: Record<string, Record<string, string[]>>;
}

export class CheckpointManager {
  private filePath: string;
  private data: CheckpointData;

  constructor(filePath: string = '.checkpoint.json') {
    this.filePath = path.resolve(filePath);
    this.data = this.load();
  }

  private load(): CheckpointData {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Only load v2 checkpoints
        if (parsed.version === '2.0') {
          logger.info(`Loaded v2 checkpoint from ${this.filePath}`);
          return parsed;
        }
        logger.warn('Found old checkpoint format. Starting fresh for v2 pipeline.');
      } catch (err: any) {
        logger.warn(`Failed to parse checkpoint file, starting fresh: ${err.message}`);
      }
    }
    return this.createEmpty();
  }

  private createEmpty(): CheckpointData {
    return {
      lastUpdated: new Date().toISOString(),
      version: '2.0',
      progress: {},
      scrapedUrls: {},
    };
  }

  public save(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err: any) {
      logger.error(`Failed to save checkpoint: ${err.message}`);
    }
  }

  // ─── Progress Tracking ──────────────────────────────────────────────

  public getProgress(category: string, provider: string): CategoryScrapeProgress | null {
    return this.data.progress[category]?.[provider] || null;
  }

  public setProgress(category: string, provider: string, progress: CategoryScrapeProgress): void {
    if (!this.data.progress[category]) {
      this.data.progress[category] = {};
    }
    this.data.progress[category][provider] = progress;
  }

  public isProviderComplete(category: string, provider: string): boolean {
    const p = this.getProgress(category, provider);
    return p?.status === 'COMPLETE' || p?.status === 'INCOMPLETE';
  }

  public isCategoryComplete(category: string, providers: string[]): boolean {
    return providers.every((p) => this.isProviderComplete(category, p));
  }

  // ─── URL Tracking ───────────────────────────────────────────────────

  public isUrlScraped(category: string, provider: string, url: string): boolean {
    const list = this.data.scrapedUrls[category]?.[provider] || [];
    return list.includes(url);
  }

  public markUrlScraped(category: string, provider: string, url: string): void {
    if (!this.data.scrapedUrls[category]) {
      this.data.scrapedUrls[category] = {};
    }
    if (!this.data.scrapedUrls[category][provider]) {
      this.data.scrapedUrls[category][provider] = [];
    }
    if (!this.data.scrapedUrls[category][provider].includes(url)) {
      this.data.scrapedUrls[category][provider].push(url);
    }
  }

  public getScrapedUrls(category: string, provider: string): string[] {
    return this.data.scrapedUrls[category]?.[provider] || [];
  }

  // ─── Reset ──────────────────────────────────────────────────────────

  public clear(): void {
    this.data = this.createEmpty();
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}
