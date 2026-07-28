import { RawScrapedProduct, ValidationResult } from '../types/adapter.js';
import { classifyProduct } from '../normalizers/relevanceClassifier.js';
import { calculateQualityScore } from '../normalizers/qualityScorer.js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config/scraper-config.json');
const aliasesPath = path.join(process.cwd(), 'config/category-aliases.json');

const SCRAPER_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const CATEGORY_ALIASES = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));

const PLACEHOLDER_PATTERNS = [
  'placeholder', 'no-image', 'default', 'coming_soon', 'missing',
  'blank', 'dummy', '1x1', 'pixel', 'via.placeholder.com',
];

/**
 * ProductValidator — Unified validation gate.
 * Every scraped product must pass ALL checks before counting toward the quota.
 */
export class ProductValidator {
  /**
   * Validate a raw scraped product against the target category.
   */
  validate(raw: RawScrapedProduct, targetCategory: string): ValidationResult {
    const reasons: string[] = [];
    const config = SCRAPER_CONFIG.validation;
    const categoryConfig = CATEGORY_ALIASES[targetCategory];

    // 1. Must have a product name of sufficient length
    if (!raw.name || raw.name.trim().length < (config.minNameLength || 10)) {
      reasons.push(`Product name too short or missing: "${raw.name || ''}"`);
      return this.reject(reasons, targetCategory);
    }

    // 2. Run the relevance classifier to determine canonical category
    const classification = classifyProduct(
      raw.name,
      raw.rawCategory || '',
      raw.description || '',
      raw.specifications || {}
    );

    if (classification.status === 'REJECTED') {
      reasons.push(`Relevance classifier REJECTED: ${classification.reasons.join('; ')}`);
      return this.reject(reasons, classification.canonicalCategory, classification.confidence);
    }

    // 3. Canonical category must match the target category
    if (classification.canonicalCategory !== targetCategory) {
      reasons.push(
        `Category mismatch: classified as "${classification.canonicalCategory}" but target is "${targetCategory}"`
      );
      return this.reject(reasons, classification.canonicalCategory, classification.confidence);
    }

    // 4. Check category-specific rejection keywords (accessories, parts, covers)
    if (categoryConfig?.rejectionKeywords && categoryConfig.rejectionKeywords.length > 0) {
      const combinedText = `${raw.name} ${raw.description || ''}`.toLowerCase();
      for (const keyword of categoryConfig.rejectionKeywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          reasons.push(`Rejected by category-specific keyword: "${keyword}"`);
          return this.reject(reasons, targetCategory);
        }
      }
    }

    // 5. Must have a valid price
    if (config.requirePrice) {
      if (raw.currentPrice === null || raw.currentPrice === undefined || raw.currentPrice <= 0) {
        reasons.push('Missing or zero price');
        return this.reject(reasons, targetCategory);
      }
      if (raw.currentPrice < (config.minPrice || 50)) {
        reasons.push(`Price ${raw.currentPrice} below minimum ${config.minPrice}`);
        return this.reject(reasons, targetCategory);
      }
    }

    // 6. Must have a valid product URL
    if (config.requireProductUrl) {
      if (!raw.productUrl || !raw.productUrl.startsWith('http')) {
        reasons.push('Missing or invalid product URL');
        return this.reject(reasons, targetCategory);
      }
    }

    // 7. Must have at least one non-placeholder image
    if (config.requireImage) {
      const validImages = (raw.images || []).filter((url) => {
        if (!url || !url.startsWith('http')) return false;
        const urlLower = url.toLowerCase();
        return !PLACEHOLDER_PATTERNS.some((p) => urlLower.includes(p));
      });
      if (validImages.length === 0) {
        reasons.push('No valid non-placeholder images found');
        return this.reject(reasons, targetCategory);
      }
    }

    // 8. Quality score check (lightweight — uses the already-parsed raw data)
    const mockProduct = {
      basic: { name: raw.name, brand: raw.brand, description: raw.description, sku: raw.sku },
      pricing: { currentPrice: raw.currentPrice },
      images: (raw.images || []).map((url, i) => ({ url, isPrimary: i === 0 })),
      dimensions: { width: raw.width, height: raw.height, length: raw.depth, weight: raw.weight },
      classification: { material: [], colors: [] },
      source: { productUrl: raw.productUrl },
    };
    const qualityResult = calculateQualityScore(mockProduct, targetCategory);
    if (qualityResult.score < (config.minQualityScore || 30)) {
      reasons.push(`Quality score ${qualityResult.score} below minimum ${config.minQualityScore}`);
      return this.reject(reasons, targetCategory, classification.confidence, qualityResult.score);
    }

    // All checks passed
    reasons.push(`Validated as "${targetCategory}" with confidence ${classification.confidence}`);
    return {
      isValid: true,
      reasons,
      canonicalCategory: targetCategory,
      confidence: classification.confidence,
      qualityScore: qualityResult.score,
    };
  }

  private reject(
    reasons: string[],
    category: string,
    confidence: number = 0,
    qualityScore: number = 0
  ): ValidationResult {
    return {
      isValid: false,
      reasons,
      canonicalCategory: category,
      confidence,
      qualityScore,
    };
  }
}
