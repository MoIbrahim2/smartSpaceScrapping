import fs from 'fs';
import path from 'path';

const weightsPath = path.join(process.cwd(), 'config/quality-weights.json');
const QUALITY_CONFIG = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));

export interface QualityResult {
  score: number;
  qualityLevel: 'EXCELLENT' | 'GOOD' | 'INCOMPLETE' | 'POOR';
  issues: string[];
}

/**
 * Calculates a quality score from 0-100 for normalized products.
 */
export function calculateQualityScore(
  product: any,
  category: string
): QualityResult {
  const issues: string[] = [];
  let score = 0;
  const w = QUALITY_CONFIG.weights;

  // 1. Canonical Category (15 pts)
  if (category && category !== 'REJECTED' && category !== 'UNKNOWN') {
    score += w.canonicalCategory;
  } else {
    issues.push("missing_canonical_category");
  }

  // 2. Product Name (10 pts)
  const name = product.basic?.name || '';
  if (name.length >= 10) {
    score += w.productName;
  } else {
    issues.push("short_or_missing_name");
  }

  // 3. Price (15 pts)
  const price = product.pricing?.currentPrice;
  if (price !== null && price !== undefined && price > 0) {
    score += w.price;
  } else {
    issues.push("missing_price");
  }

  // 4. Primary Image (15 pts)
  const images = product.images || [];
  const hasPrimaryImage = images.some((img: any) => img.isPrimary && img.url && img.url.startsWith('http'));
  if (hasPrimaryImage) {
    score += w.primaryImage;
  } else {
    issues.push("missing_primary_image");
  }

  // 5. Dimensions (20 pts)
  const dims = product.dimensions || {};
  const hasWidth = dims.width !== null && dims.width !== undefined && dims.width > 0;
  const hasHeight = dims.height !== null && dims.height !== undefined && dims.height > 0;
  const hasLength = (dims.length ?? dims.depth) !== null && (dims.length ?? dims.depth) !== undefined && (dims.length ?? dims.depth) > 0;
  
  const dimensionsComplete = hasWidth && hasHeight && hasLength;
  if (dimensionsComplete) {
    score += w.dimensions;
  } else {
    // Partial dimensions check
    const count = (hasWidth ? 1 : 0) + (hasHeight ? 1 : 0) + (hasLength ? 1 : 0);
    score += Math.round((count / 3) * w.dimensions * 0.5); // Max 10 pts for partial
    issues.push("incomplete_dimensions");

    // Apply severe penalty for large furniture categories if dimensions are missing
    const isLargeFurniture = QUALITY_CONFIG.largeFurnitureCategories.includes(category);
    if (isLargeFurniture) {
      score -= QUALITY_CONFIG.missingDimensionsPenaltyForLargeFurniture;
      issues.push("large_furniture_missing_dimensions_penalty");
    }
  }

  // 6. Description (5 pts)
  const desc = product.basic?.description || '';
  if (desc.trim().length > 30) {
    score += w.description;
  } else {
    issues.push("short_or_missing_description");
  }

  // 7. Materials (5 pts)
  const mats = product.classification?.material || [];
  if (mats.length > 0 && !mats.includes('Wood') && mats.some((m: string) => m !== 'Wood')) {
    score += w.materials;
  } else if (mats.length > 0) {
    score += w.materials * 0.6;
  } else {
    issues.push("missing_materials");
  }

  // 8. Colors (5 pts)
  const colors = product.classification?.colors || [];
  if (colors.length > 0 && !colors.includes('Beige')) {
    score += w.colors;
  } else if (colors.length > 0) {
    score += w.colors * 0.6;
  } else {
    issues.push("missing_colors");
  }

  // 9. Brand (5 pts)
  const brand = product.basic?.brand || '';
  const isGeneric = !brand || brand.includes('Generic') || brand.includes('غير محدد') || brand.includes('Amazon Furnishings') || brand.includes('Noon Home');
  if (!isGeneric) {
    score += w.brand;
  } else {
    score += w.brand * 0.4;
    issues.push("generic_brand");
  }

  // 10. Product URL (5 pts)
  const url = product.source?.productUrl || '';
  if (url && url.startsWith('http')) {
    score += w.productUrl;
  } else {
    issues.push("missing_product_url");
  }

  // Bound the final score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  let qualityLevel: 'EXCELLENT' | 'GOOD' | 'INCOMPLETE' | 'POOR' = 'POOR';
  if (score >= 80) qualityLevel = 'EXCELLENT';
  else if (score >= 60) qualityLevel = 'GOOD';
  else if (score >= 40) qualityLevel = 'INCOMPLETE';

  return {
    score,
    qualityLevel,
    issues
  };
}
