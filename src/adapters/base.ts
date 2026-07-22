import { CategorySeed, IScraperAdapter, RawScrapedProduct, ScrapePageResult } from '../types/adapter.js';
import { UnifiedProduct, UnifiedProductSchema } from '../types/schema.js';
import { isFurnishingProduct, normalizeCategory } from '../normalizers/category.js';
import { normalizeStyles } from '../normalizers/style.js';
import { normalizeColors } from '../normalizers/color.js';
import { normalizeMaterials } from '../normalizers/material.js';
import { inferRoomTypes } from '../normalizers/room.js';
import { extractDimensions } from '../normalizers/dimensions.js';
import { enrichProductAI } from '../normalizers/aiEnrichment.js';
import { HttpClient } from '../core/http.js';
import { logger } from '../core/logger.js';

export abstract class BaseAdapter implements IScraperAdapter {
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  protected httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  abstract getCategorySeeds(): Promise<CategorySeed[]>;
  abstract scrapeCategoryPage(categorySeed: CategorySeed, page: number): Promise<ScrapePageResult>;
  abstract scrapeProduct(url: string): Promise<RawScrapedProduct | null>;

  public transform(raw: RawScrapedProduct): UnifiedProduct {
    const rawName = raw.name || 'Untitled Home Product';
    const rawDesc = raw.description || '';
    const rawCategory = raw.rawCategory || '';

    // Step 1: Normalize Category
    const categoryMapping = normalizeCategory(rawName, rawCategory);
    
    // Step 2: Normalize Attributes
    const combinedText = `${rawName} ${rawDesc} ${rawCategory} ${raw.rawStyle || ''} ${raw.rawMaterial || ''} ${raw.rawColor || ''}`;
    const styles = normalizeStyles(combinedText, categoryMapping.category);
    const colors = normalizeColors(combinedText);
    const materials = normalizeMaterials(combinedText);
    const roomTypes = inferRoomTypes(categoryMapping.category, combinedText);

    // Step 3: Dimensions Extractor (with Category Fallback Engine)
    const extractedDims = extractDimensions(
      raw.specifications || {},
      rawName,
      rawDesc,
      categoryMapping.category
    );
    const finalWidth = raw.width ?? extractedDims.width;
    const finalHeight = raw.height ?? extractedDims.height;
    const finalDepth = raw.depth ?? extractedDims.depth;
    const finalWeight = raw.weight ?? extractedDims.weight;

    // Step 4: AI Enrichment
    const aiData = enrichProductAI(
      rawName,
      rawDesc,
      raw.brand || this.name,
      categoryMapping.category,
      styles,
      colors,
      materials,
      roomTypes
    );

    // Step 5: Images format
    const formattedImages = raw.images.map((imgUrl, index) => ({
      url: imgUrl,
      isPrimary: index === 0,
    }));
    if (formattedImages.length === 0) {
      formattedImages.push({
        url: 'https://via.placeholder.com/600x600.png?text=SmartSpaceAI+Furniture',
        isPrimary: true,
      });
    }

    // Step 6: Pricing calculations
    const curPrice = Math.max(0, raw.currentPrice || 0);
    const origPrice = Math.max(curPrice, raw.originalPrice || curPrice);
    const discount = origPrice > curPrice ? Math.round(((origPrice - curPrice) / origPrice) * 100) : 0;

    const nowIso = new Date().toISOString();

    const candidate: UnifiedProduct = {
      externalId: raw.externalId,
      source: {
        marketplace: this.name,
        country: 'Egypt',
        productUrl: raw.productUrl,
        scrapedAt: nowIso,
        lastUpdated: nowIso,
      },
      basic: {
        name: rawName,
        brand: raw.brand || 'Generic',
        description: rawDesc,
        sku: raw.sku || raw.externalId,
      },
      classification: {
        category: categoryMapping.category,
        subcategory: categoryMapping.subcategory,
        roomTypes: roomTypes,
        style: styles,
        material: materials,
        colors: colors,
        tags: [categoryMapping.category, ...styles, ...colors],
      },
      pricing: {
        currency: 'EGP',
        currentPrice: curPrice,
        originalPrice: origPrice,
        discountPercentage: discount,
      },
      dimensions: {
        width: finalWidth,
        height: finalHeight,
        depth: finalDepth,
        weight: finalWeight,
        unit: 'cm',
      },
      images: formattedImages,
      availability: {
        inStock: raw.inStock ?? true,
        stockStatus: raw.stockStatus || (raw.inStock === false ? 'Out of Stock' : 'In Stock'),
        deliveryAvailable: raw.deliveryAvailable ?? true,
      },
      rating: {
        average: Math.min(5, Math.max(0, raw.ratingAverage || 0)),
        reviews: Math.max(0, raw.ratingReviews || 0),
      },
      ai: aiData,
    };

    // Validate schema
    const result = UnifiedProductSchema.safeParse(candidate);
    if (!result.success) {
      logger.error(`Validation failed for product ${raw.externalId}: ${result.error.message}`);
      throw new Error(`Unified Schema validation error: ${result.error.message}`);
    }

    return result.data;
  }
}
