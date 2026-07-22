import { describe, it, expect } from 'vitest';
import { normalizeCategory, isFurnishingProduct } from '../src/normalizers/category.js';
import { normalizeStyles } from '../src/normalizers/style.js';
import { normalizeColors } from '../src/normalizers/color.js';
import { normalizeMaterials } from '../src/normalizers/material.js';
import { inferRoomTypes } from '../src/normalizers/room.js';
import { enrichProductAI } from '../src/normalizers/aiEnrichment.js';
import { extractDimensions } from '../src/normalizers/dimensions.js';

describe('Normalizers Unit Tests', () => {
  it('should normalize different marketplace category terms to Unified category', () => {
    expect(normalizeCategory('3 Seater Sofa').category).toBe('Sofa');
    expect(normalizeCategory('Three Seat Couch').category).toBe('Sofa');
    expect(normalizeCategory('كنبة 3 مقاعد أليفة').category).toBe('Sofa');

    expect(normalizeCategory('Oak Center Coffee Table').category).toBe('Coffee Table');
    expect(normalizeCategory('ترابيزة قهوة خشب').category).toBe('Coffee Table');

    expect(normalizeCategory('Office Chair Executive').category).toBe('Office Chair');
    expect(normalizeCategory('كرسي مكتب هيدروليك').category).toBe('Office Chair');
  });

  it('should filter out non-furniture/home decor products', () => {
    expect(isFurnishingProduct('iPhone 15 Pro Max 256GB')).toBe(false);
    expect(isFurnishingProduct('Men T-Shirt Casual')).toBe(false);
    expect(isFurnishingProduct('Modern Velvet Sofa 3-Seater')).toBe(true);
    expect(isFurnishingProduct('ترابيزة سفرة مودرن')).toBe(true);
  });

  it('should normalize styles into allowed set', () => {
    const styles = normalizeStyles('Scandinavian minimal oak dining desk table for modern home', 'Desk');
    expect(styles).toContain('Scandinavian');
    expect(styles).toContain('Minimalist');
    expect(styles).toContain('Modern');
  });

  it('should normalize colors into allowed set', () => {
    const colors = normalizeColors('White and Walnut Brown Bed Frame with Gold accents');
    expect(colors).toContain('White');
    expect(colors).toContain('Brown');
    expect(colors).toContain('Gold');
  });

  it('should normalize materials into allowed set', () => {
    const materials = normalizeMaterials('Solid Beech Wood table with Tempered Glass top and Steel legs');
    expect(materials).toContain('Solid Wood');
    expect(materials).toContain('Wood');
    expect(materials).toContain('Glass');
    expect(materials).toContain('Steel');
    expect(materials).toContain('Metal');
  });

  it('should infer room compatibility accurately', () => {
    const livingRooms = inferRoomTypes('Coffee Table');
    expect(livingRooms).toContain('Living Room');

    const bedroomRooms = inferRoomTypes('Nightstand');
    expect(bedroomRooms).toContain('Bedroom');

    const officeRooms = inferRoomTypes('Office Chair');
    expect(officeRooms).toContain('Office');
  });

  it('should extract dimensions correctly from Amazon, Jumia, Noon, and IKEA exact user HTML structures', () => {
    // 1. Amazon Egypt User HTML Snippet: 70العمق x 165العرض x 75الارتفاع سم
    const amzDims = extractDimensions({}, 'Sofa', '70العمق x 165العرض x 75الارتفاع سم');
    expect(amzDims.width).toBe(165);
    expect(amzDims.depth).toBe(70);
    expect(amzDims.height).toBe(75);

    // 2. Jumia Egypt User HTML Snippet: الحجم (طولx عرضx ارتفاع سم): 120*190 CM
    const jumiaDims = extractDimensions({ 'الحجم (طولx عرضx ارتفاع سم)': '120*190 CM' });
    expect(jumiaDims.width).toBe(120);
    expect(jumiaDims.depth).toBe(190);

    // 3. Noon Egypt User HTML Snippet: Product Length 120 cm / Height (cm) 80 Width (cm) 210 Depth (cm) 80
    const noonDimsSpec = extractDimensions({ 'Product Length': '120 cm', 'Product Height': '220 cm' });
    expect(noonDimsSpec.depth).toBe(120);
    expect(noonDimsSpec.height).toBe(220);

    const noonDimsDesc = extractDimensions({}, 'Sofa', 'Height (cm) 80 Width (cm) 210 Depth (cm) 80');
    expect(noonDimsDesc.height).toBe(80);
    expect(noonDimsDesc.width).toBe(210);
    expect(noonDimsDesc.depth).toBe(80);

    // 4. IKEA Egypt User HTML Snippet: العمق: 86 سم, الإرتفاع: 99 سم, العرض: 82 سم, الوزن: 25.72 كلغ
    const ikeaDims = extractDimensions({
      'العمق': '86 سم',
      'الإرتفاع': '99 سم',
      'العرض': '82 سم',
      'الوزن': '25.72 كلغ'
    });
    expect(ikeaDims.depth).toBe(86);
    expect(ikeaDims.height).toBe(99);
    expect(ikeaDims.width).toBe(82);
    expect(ikeaDims.weight).toBe(25.7);
  });

  it('should generate rich semantic embedding text in AI enrichment', () => {
    const enrichment = enrichProductAI(
      'Scandinavian Coffee Table',
      'Solid oak coffee table with sleek white legs',
      'IKEA',
      'Coffee Table',
      ['Scandinavian', 'Minimalist'],
      ['White', 'Natural Wood'],
      ['Solid Wood', 'Metal'],
      ['Living Room']
    );

    expect(enrichment.embeddingText).toContain('Scandinavian/Minimalist');
    expect(enrichment.embeddingText).toContain('coffee table');
    expect(enrichment.embeddingText).toContain('Living Room');
    expect(enrichment.keywords.length).toBeGreaterThan(0);
  });
});
