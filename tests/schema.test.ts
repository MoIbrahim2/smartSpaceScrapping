import { describe, it, expect } from 'vitest';
import { UnifiedProductSchema } from '../src/types/schema.js';

describe('UnifiedProductSchema Validation', () => {
  it('should validate a complete and correct product object', () => {
    const validProduct = {
      externalId: 'test-123',
      source: {
        marketplace: 'IKEA Egypt',
        country: 'Egypt',
        productUrl: 'https://www.ikea.com/eg/ar/p/sofa-123',
        scrapedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      basic: {
        name: 'KLIPPAN 2-Seat Sofa',
        brand: 'IKEA',
        description: 'Comfortable modern fabric sofa in grey',
        sku: '12345678',
      },
      classification: {
        canonicalCategory: 'Sofa',
        roomTypes: ['living_room'],
        styles: ['Modern'],
        materials: ['Fabric', 'Wood'],
        colors: ['Gray'],
        tags: ['Sofa', 'Modern', 'Gray'],
      },
      pricing: {
        currency: 'EGP',
        currentPrice: 8500,
        originalPrice: 10000,
        discountPercentage: 15,
      },
      dimensions: {
        width: 180,
        height: 85,
        length: 88,
        dimensionUnit: 'cm',
        weight: 35,
        weightUnit: 'kg',
      },
      images: [
        { url: 'https://www.ikea.com/img1.jpg', isPrimary: true },
        { url: 'https://www.ikea.com/img2.jpg', isPrimary: false },
      ],
      availability: {
        inStock: true,
        stockStatus: 'In Stock',
      },
      rating: {
        average: 4.5,
        reviews: 42,
      },
      ai: {
        embeddingText: 'Modern Gray Fabric sofa by IKEA ideal for Living Room.',
        styleLabels: ['Modern'],
        dominantColors: ['Gray'],
        roomCompatibility: ['living_room'],
        keywords: ['sofa', 'modern', 'gray', 'ikea'],
      },
      processing: {
        status: 'ACCEPTED',
        categoryConfidence: 0.95,
        qualityScore: 85,
        issues: [],
        normalizationVersion: '1.0'
      }
    };

    const parsed = UnifiedProductSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid currency or missing required fields', () => {
    const invalidProduct = {
      externalId: 'test-456',
      source: {
        marketplace: 'Amazon Egypt',
        country: 'USA', // Invalid: Must be 'Egypt'
        productUrl: 'invalid-url',
        scrapedAt: 'now',
        lastUpdated: 'now',
      },
      basic: {
        name: 'Invalid Sofa',
        brand: 'Generic',
        description: 'Test',
        sku: 'SKU456',
      },
      pricing: {
        currency: 'USD', // Invalid: Must be 'EGP'
        currentPrice: -500, // Invalid: Cannot be negative
      },
    };

    const parsed = UnifiedProductSchema.safeParse(invalidProduct);
    expect(parsed.success).toBe(false);
  });
});
