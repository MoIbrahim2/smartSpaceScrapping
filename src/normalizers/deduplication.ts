import { UnifiedProduct } from '../types/schema.js';

export function deduplicateProducts(products: UnifiedProduct[]): UnifiedProduct[] {
  const map = new Map<string, UnifiedProduct>();

  for (const product of products) {
    // Unique key priority: SKU (if non-empty & valid), or marketplace + externalId
    let key = '';
    const cleanSku = product.basic.sku.trim().toUpperCase();
    if (cleanSku && cleanSku !== 'N/A' && cleanSku !== 'UNKNOWN' && cleanSku.length > 3) {
      key = `SKU:${cleanSku}`;
    } else {
      key = `MARKET:${product.source.marketplace}:${product.externalId}`;
    }

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Merge best attributes (e.g. higher rating review count, richer images)
      if (product.images.length > existing.images.length) {
        existing.images = product.images;
      }
      if (product.rating.reviews > existing.rating.reviews) {
        existing.rating = product.rating;
      }
      // Combine room types & tags
      existing.classification.roomTypes = Array.from(
        new Set([...existing.classification.roomTypes, ...product.classification.roomTypes])
      );
      existing.classification.tags = Array.from(
        new Set([...existing.classification.tags, ...product.classification.tags])
      );
      existing.source.lastUpdated = product.source.scrapedAt;
    } else {
      map.set(key, { ...product });
    }
  }

  return Array.from(map.values());
}
