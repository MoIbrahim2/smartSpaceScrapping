import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { UnifiedProduct } from '../types/schema.js';

export interface CheckpointData {
  lastUpdated: string;
  scrapedUrls: Record<string, string[]>; // adapterName -> list of product URLs scraped
  completedCategories: Record<string, string[]>; // adapterName -> list of category URLs finished
  savedProducts: UnifiedProduct[];
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
        logger.info(`Loaded checkpoint from ${this.filePath}`);
        return JSON.parse(raw);
      } catch (err: any) {
        logger.warn(`Failed to parse checkpoint file, starting fresh: ${err.message}`);
      }
    }
    return {
      lastUpdated: new Date().toISOString(),
      scrapedUrls: {},
      completedCategories: {},
      savedProducts: [],
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

  public isUrlScraped(adapterName: string, url: string): boolean {
    const list = this.data.scrapedUrls[adapterName] || [];
    return list.includes(url);
  }

  public markUrlScraped(adapterName: string, url: string): void {
    if (!this.data.scrapedUrls[adapterName]) {
      this.data.scrapedUrls[adapterName] = [];
    }
    if (!this.data.scrapedUrls[adapterName].includes(url)) {
      this.data.scrapedUrls[adapterName].push(url);
    }
  }

  public addProduct(product: UnifiedProduct): void {
    this.data.savedProducts.push(product);
  }

  public getSavedProducts(): UnifiedProduct[] {
    return this.data.savedProducts;
  }

  public clear(): void {
    this.data = {
      lastUpdated: new Date().toISOString(),
      scrapedUrls: {},
      completedCategories: {},
      savedProducts: [],
    };
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}
