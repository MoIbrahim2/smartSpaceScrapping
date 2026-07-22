import { describe, it, expect } from 'vitest';
import { HttpClient } from '../src/core/http.js';
import { AmazonAdapter } from '../src/adapters/amazon.js';
import { NoonAdapter } from '../src/adapters/noon.js';
import { JumiaAdapter } from '../src/adapters/jumia.js';
import { IkeaAdapter } from '../src/adapters/ikea.js';

describe('Adapters Transformation & Schema Validation Tests', () => {
  const http = new HttpClient();

  it('AmazonAdapter should transform raw product into valid Unified Product schema', () => {
    const adapter = new AmazonAdapter(http);
    const unified = adapter.transform({
      externalId: 'B08XYZ1234',
      marketplace: 'Amazon Egypt',
      productUrl: 'https://www.amazon.eg/dp/B08XYZ1234',
      name: 'Modern 3-Seater Fabric Sofa - Grey',
      brand: 'Amazon Basics',
      description: 'High quality modern grey fabric sofa for living room',
      sku: 'B08XYZ1234',
      currentPrice: 7500,
      originalPrice: 9000,
      currency: 'EGP',
      images: ['https://images-na.ssl-images-amazon.com/images/I/71xyz.jpg'],
      inStock: true,
      ratingAverage: 4.3,
      ratingReviews: 18,
    });

    expect(unified.source.marketplace).toBe('Amazon Egypt');
    expect(unified.source.country).toBe('Egypt');
    expect(unified.basic.name).toBe('Modern 3-Seater Fabric Sofa - Grey');
    expect(unified.classification.category).toBe('Sofa');
    expect(unified.classification.roomTypes).toContain('Living Room');
    expect(unified.pricing.currentPrice).toBe(7500);
    expect(unified.pricing.discountPercentage).toBe(17); // (9000-7500)/9000 = 16.66% -> 17%
    expect(unified.images[0].isPrimary).toBe(true);
  });

  it('IkeaAdapter should transform raw product into valid Unified Product schema', () => {
    const adapter = new IkeaAdapter(http);
    const unified = adapter.transform({
      externalId: '104.234.56',
      marketplace: 'IKEA Egypt',
      productUrl: 'https://www.ikea.com/eg/ar/p/lack-coffee-table-black-10423456/',
      name: 'LACK Coffee table - Black 90x55 cm',
      brand: 'IKEA',
      description: 'LACK center coffee table in stylish black wood finish',
      sku: '10423456',
      currentPrice: 1250,
      originalPrice: 1250,
      currency: 'EGP',
      images: ['https://www.ikea.com/eg/ar/images/products/lack-coffee-table.jpg'],
      inStock: true,
    });

    expect(unified.source.marketplace).toBe('IKEA Egypt');
    expect(unified.classification.category).toBe('Coffee Table');
    expect(unified.classification.colors).toContain('Black');
    expect(unified.pricing.currency).toBe('EGP');
  });
});
