export interface ExtractedDimensions {
  width: number | null;
  height: number | null;
  depth: number | null;
  weight: number | null;
  unit: 'cm';
}

/**
 * Standard Category Fallback Dimensions (width, depth, height, weight) in cm
 * Derived from /category_rules/*.json for products where e-commerce sellers omit HTML specs.
 */
const CATEGORY_DEFAULT_DIMENSIONS: Record<
  string,
  { width: number; depth: number; height: number; weight: number }
> = {
  Sofa: { width: 200, depth: 90, height: 85, weight: 45 },
  Armchair: { width: 80, depth: 85, height: 85, weight: 18 },
  'Bedroom Armchair': { width: 75, depth: 80, height: 85, weight: 16 },
  'Coffee Table': { width: 110, depth: 60, height: 45, weight: 15 },
  'Side Table': { width: 50, depth: 50, height: 55, weight: 8 },
  'Outdoor Table': { width: 70, depth: 70, height: 60, weight: 10 },
  'Dining Table': { width: 160, depth: 90, height: 75, weight: 30 },
  'Office Desk': { width: 120, depth: 60, height: 75, weight: 22 },
  'Gaming Desk': { width: 140, depth: 70, height: 75, weight: 25 },
  'Study Desk': { width: 100, depth: 55, height: 75, weight: 18 },
  'Dining Chairs': { width: 50, depth: 50, height: 90, weight: 7 },
  'Bar Stool': { width: 45, depth: 45, height: 75, weight: 6 },
  'Outdoor Seating': { width: 120, depth: 70, height: 80, weight: 20 },
  'Gaming Chair': { width: 70, depth: 70, height: 125, weight: 16 },
  'Study Chair': { width: 50, depth: 50, height: 85, weight: 8 },
  'Office Chair': { width: 65, depth: 65, height: 115, weight: 14 },
  Bed: { width: 160, depth: 200, height: 110, weight: 50 },
  'Kids Bed': { width: 100, depth: 190, height: 90, weight: 35 },
  Wardrobe: { width: 150, depth: 60, height: 210, weight: 75 },
  'Kids Wardrobe': { width: 120, depth: 55, height: 180, weight: 50 },
  Nightstand: { width: 50, depth: 40, height: 55, weight: 10 },
  Dresser: { width: 120, depth: 45, height: 85, weight: 35 },
  'TV Unit': { width: 160, depth: 45, height: 50, weight: 25 },
  'Buffet Sideboard': { width: 150, depth: 45, height: 85, weight: 40 },
  Bookshelf: { width: 80, depth: 30, height: 180, weight: 20 },
  'Filing Cabinet': { width: 45, depth: 50, height: 100, weight: 18 },
  'Storage Rack': { width: 70, depth: 35, height: 120, weight: 12 },
  'Storage Unit': { width: 80, depth: 40, height: 120, weight: 16 },
  'Kitchen Cabinet Set': { width: 240, depth: 60, height: 210, weight: 120 },
  Countertop: { width: 180, depth: 60, height: 4, weight: 35 },
  'Kitchen Island': { width: 120, depth: 80, height: 90, weight: 45 },
  'Vanity Unit': { width: 80, depth: 50, height: 85, weight: 30 },
  'Shower Enclosure': { width: 90, depth: 90, height: 200, weight: 40 },
  Toilet: { width: 38, depth: 65, height: 40, weight: 25 },
  'Mirror Cabinet': { width: 60, depth: 15, height: 70, weight: 10 },
  Shelving: { width: 50, depth: 20, height: 80, weight: 6 },
  'Towel Rack': { width: 60, depth: 12, height: 15, weight: 2 },
  'Accessories Set': { width: 25, depth: 15, height: 15, weight: 2 },
  Curtains: { width: 140, depth: 5, height: 240, weight: 2 },
  'Outdoor Rug': { width: 120, depth: 180, height: 1, weight: 4 },
  Rug: { width: 160, depth: 230, height: 1, weight: 5 },
  'Floor Lamp': { width: 40, depth: 40, height: 160, weight: 6 },
  'Table Lamp': { width: 25, depth: 25, height: 45, weight: 2 },
  'Desk Lamp': { width: 20, depth: 20, height: 45, weight: 2 },
  'Outdoor Lighting': { width: 20, depth: 20, height: 30, weight: 1 },
  'Bathroom Lighting': { width: 30, depth: 15, height: 15, weight: 2 },
  'Kitchen Lighting': { width: 60, depth: 10, height: 5, weight: 2 },
  'LED Lighting': { width: 100, depth: 2, height: 2, weight: 1 },
  Chandelier: { width: 60, depth: 60, height: 60, weight: 6 },
  'Night Light': { width: 15, depth: 10, height: 20, weight: 1 },
  'Wall Art': { width: 80, depth: 4, height: 60, weight: 3 },
  'Wall Decor': { width: 60, depth: 4, height: 60, weight: 2 },
  Mirror: { width: 60, depth: 4, height: 120, weight: 8 },
  Planter: { width: 30, depth: 30, height: 40, weight: 4 },
  Swing: { width: 100, depth: 80, height: 190, weight: 25 },
  'Sound System Stand': { width: 30, depth: 30, height: 80, weight: 5 },
  'Wall Shelf': { width: 60, depth: 20, height: 10, weight: 3 },
  Whiteboard: { width: 90, depth: 3, height: 60, weight: 4 },
};

/**
 * Universal Dimension Extractor Engine
 * Extracts dimensions from raw HTML/specs/text, and falls back to Category Default Rules if missing.
 */
export function extractDimensions(
  specs: Record<string, string> = {},
  title: string = '',
  description: string = '',
  category: string = ''
): ExtractedDimensions {
  let width: number | null = null;
  let height: number | null = null;
  let depth: number | null = null;
  let weight: number | null = null;

  const combinedText = `${title} ${description} ${Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(' ')}`;

  // 1. Amazon Egypt specific merged string format: "70العمق x 165العرض x 75الارتفاع سم"
  const amzWidthMatch = combinedText.match(/(\d+(?:\.\d+)?)\s*العرض/i);
  if (amzWidthMatch) width = normalizeToCm(parseFloat(amzWidthMatch[1]), 'cm');

  const amzHeightMatch = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:الارتفاع|الإرتفاع)/i);
  if (amzHeightMatch) height = normalizeToCm(parseFloat(amzHeightMatch[1]), 'cm');

  const amzDepthMatch = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:العمق|الطول|طول)/i);
  if (amzDepthMatch) depth = normalizeToCm(parseFloat(amzDepthMatch[1]), 'cm');

  // 2. Noon Inline Description format: "Height (cm) 80 Width (cm) 210 Depth (cm) 80"
  if (width === null) {
    const nWidth = combinedText.match(/Width\s*\((?:cm|m|سم)\)\s*(\d+(?:\.\d+)?)/i);
    if (nWidth) width = normalizeToCm(parseFloat(nWidth[1]), 'cm');
  }
  if (height === null) {
    const nHeight = combinedText.match(/Height\s*\((?:cm|m|سم)\)\s*(\d+(?:\.\d+)?)/i);
    if (nHeight) height = normalizeToCm(parseFloat(nHeight[1]), 'cm');
  }
  if (depth === null) {
    const nDepth = combinedText.match(/Depth\s*\((?:cm|m|سم)\)\s*(\d+(?:\.\d+)?)/i);
    if (nDepth) depth = normalizeToCm(parseFloat(nDepth[1]), 'cm');
  }

  // 3. Extract from Specifications Dictionary (IKEA, Noon, Jumia spec tables)
  for (const [key, value] of Object.entries(specs)) {
    const kLower = key.toLowerCase().trim();
    const vLower = value.toLowerCase().trim();

    // Skip seat measurements (like seat height / seat depth) to focus on overall product dimensions unless product depth is missing
    if (kLower.includes('مقعد') || kLower.includes('seat')) continue;

    if (width === null && (kLower.includes('width') || kLower === 'عرض' || kLower === 'العرض' || kLower.includes('product width'))) {
      const val = parseSingleDimension(vLower);
      if (val !== null) width = val;
    }

    if (height === null && (kLower.includes('height') || kLower === 'ارتفاع' || kLower === 'إرتفاع' || kLower === 'الارتفاع' || kLower === 'الإرتفاع' || kLower.includes('product height'))) {
      const val = parseSingleDimension(vLower);
      if (val !== null) height = val;
    }

    if (depth === null && (kLower.includes('depth') || kLower.includes('length') || kLower === 'عمق' || kLower === 'العمق' || kLower === 'طول' || kLower === 'الطول' || kLower.includes('product length') || kLower.includes('product depth'))) {
      const val = parseSingleDimension(vLower);
      if (val !== null) depth = val;
    }

    if (weight === null && (kLower.includes('weight') || kLower.includes('وزن') || kLower.includes('الوزن'))) {
      const wVal = parseWeight(vLower);
      if (wVal !== null) weight = wVal;
    }
  }

  // 4. Regex for 3D Format (e.g. 120*190*75 or 120 x 190 x 75 cm)
  if (width === null || height === null || depth === null) {
    const match3D = combinedText.match(
      /(\d+(?:\.\d+)?)\s*(?:m|cm|mm|م|سم)?\s*[*x×]\s*(\d+(?:\.\d+)?)\s*(?:m|cm|mm|م|سم)?\s*[*x×]\s*(\d+(?:\.\d+)?)\s*(?:m|cm|mm|م|سم)?/i
    );

    if (match3D) {
      const d1 = normalizeToCm(parseFloat(match3D[1]), match3D[0]);
      const d2 = normalizeToCm(parseFloat(match3D[2]), match3D[0]);
      const d3 = normalizeToCm(parseFloat(match3D[3]), match3D[0]);

      if (width === null) width = d1;
      if (depth === null) depth = d2;
      if (height === null) height = d3;
    }
  }

  // 5. Regex for 2D Format (e.g. Jumia: 120*190 CM or 90x55 cm)
  if (width === null || depth === null) {
    const match2D = combinedText.match(/(\d+(?:\.\d+)?)\s*(?:m|cm|mm|م|سم)?\s*[*x×]\s*(\d+(?:\.\d+)?)\s*(?:m|cm|mm|م|سم)?/i);
    if (match2D) {
      const d1 = normalizeToCm(parseFloat(match2D[1]), match2D[0]);
      const d2 = normalizeToCm(parseFloat(match2D[2]), match2D[0]);
      if (width === null) width = d1;
      if (depth === null) depth = d2;
    }
  }

  // 6. Intelligent Category Rules Default Fallback
  // If any dimension remains null after HTML extraction, fill using category defaults
  const catDefault = CATEGORY_DEFAULT_DIMENSIONS[category] || { width: 100, depth: 50, height: 75, weight: 10 };

  if (width === null) width = catDefault.width;
  if (depth === null) depth = catDefault.depth;
  if (height === null) height = catDefault.height;
  if (weight === null) weight = catDefault.weight;

  return {
    width: Math.round(width),
    height: Math.round(height),
    depth: Math.round(depth),
    weight: Math.round(weight * 10) / 10,
    unit: 'cm',
  };
}

function parseSingleDimension(str: string): number | null {
  const match = str.match(/(\d+(?:\.\d+)?)\s*(cm|m|mm|سم|م|كلغ|kg)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2] || 'cm';
  return normalizeToCm(num, unit);
}

function parseWeight(str: string): number | null {
  const match = str.match(/(\d+(?:\.\d+)?)\s*(kg|g|كجم|جم|كلغ|كيلو)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2] ? match[2].toLowerCase() : 'kg';
  if (unit === 'g' || unit === 'جم') return num / 1000;
  return num;
}

function normalizeToCm(value: number, context: string): number {
  if (context.includes('m') || context.includes('م')) {
    if (value < 10) return value * 100;
  }
  if (context.includes('mm') || context.includes('مم')) {
    return value / 10;
  }
  return value;
}
