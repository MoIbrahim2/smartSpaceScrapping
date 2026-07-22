import { describe, it, expect } from 'vitest';
import { deduplicateProducts } from '../src/normalizers/deduplication.js';
import { UnifiedProduct } from '../src/types/schema.js';

describe('Deduplication Engine Unit Tests', () => {
  it('should merge duplicate products with matching SKU across marketplaces', () => {
    const product1: UnifiedProduct = {
      externalId: 'SKU-SOFA-001',
      source: {
        marketplace: 'Amazon Egypt',
        country: 'Egypt',
        productUrl: 'https://amazon.eg/dp/1',
        scrapedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      basic: {
        name: 'Modern 3 Seater Sofa',
        brand: 'FurnitureCo',
        description: 'Desc 1',
        sku: 'SKU-SOFA-001',
      },
      classification: {
        category: 'Sofa',
        subcategory: 'Living Room Seating',
        roomTypes: ['Living Room'],
        style: ['Modern'],
        material: ['Fabric'],
        colors: ['Gray'],
        tags: ['Sofa'],
      },
      pricing: { currency: 'EGP', currentPrice: 5000, originalPrice: 6000, discountPercentage: 17 },
      dimensions: { width: 200, height: 80, depth: 90, weight: 40, unit: 'cm' },
      images: [{ url: 'https://amazon.eg/img1.jpg', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'In Stock', deliveryAvailable: true },
      rating: { average: 4.0, reviews: 10 },
      ai: { embeddingText: 'Sofa', styleLabels: [], dominantColors: [], roomCompatibility: [], keywords: [] },
    };

    const product2: UnifiedProduct = {
      ...product1,
      source: {
        ...product1.source,
        marketplace: 'Noon Egypt',
        productUrl: 'https://noon.com/p/2',
      },
      images: [
        { url: 'https://noon.com/img1.jpg', isPrimary: true },
        { url: 'https://noon.com/img2.jpg', isPrimary: false },
      ],
      rating: { average: 4.8, reviews: 50 },
    };

    const merged = deduplicateProducts([product1, product2]);

    expect(merged.length).toBe(1);
    expect(merged[0].rating.reviews).toBe(50); // Kept product with higher review count
    expect(merged[0].images.length).toBe(2); // Kept product with richer images list
  });
});
