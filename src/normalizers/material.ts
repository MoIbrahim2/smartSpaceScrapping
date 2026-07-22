import { ALLOWED_MATERIALS, MaterialType } from '../types/schema.js';

const MATERIAL_KEYWORDS: Record<MaterialType, string[]> = {
  'Solid Wood': ['solid wood', 'beech wood', 'oak wood', 'pine wood', 'خشب طبيعي', 'خشب زان', 'خشب ارو', 'خشب عزيزي'],
  'Engineered Wood': ['mdf', 'particle board', 'plywood', 'engineered wood', 'veneer', 'ميلامين', 'ام دي اف', 'خشب حبيبي', 'خشب مسنع'],
  Wood: ['wood', 'wooden', 'خشب', 'خشبي'],
  Steel: ['steel', 'stainless steel', 'حديد صلب', 'ستانلس'],
  Metal: ['metal', 'iron', 'brass', 'aluminum', 'معدن', 'معدني', 'حديد'],
  Glass: ['glass', 'tempered glass', 'زجاج', 'زجاجي', 'بايركس'],
  Plastic: ['plastic', 'acrylic', 'polypropylene', 'بلاستيك', 'اكريليك'],
  Velvet: ['velvet', 'قطيفة'],
  Leather: ['leather', 'faux leather', 'pu leather', 'جلد', 'جلد صناعي'],
  Fabric: ['fabric', 'linen', 'cotton', 'upholstered', 'قماش', 'كتان', 'قطن'],
  Marble: ['marble', 'رخام', 'رخامي'],
  Stone: ['stone', 'granite', 'حجر', 'جرانيت'],
  Ceramic: ['ceramic', 'porcelain', 'سيراميك', 'بورسلين'],
  Concrete: ['concrete', 'cement', 'خرسانة', 'أسمنت'],
};

export function normalizeMaterials(text: string): MaterialType[] {
  const lowerText = text.toLowerCase();
  const matchedMaterials = new Set<MaterialType>();

  for (const material of ALLOWED_MATERIALS) {
    const keywords = MATERIAL_KEYWORDS[material];
    if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
      matchedMaterials.add(material);
    }
  }

  // Refine Wood vs Solid/Engineered Wood
  if (matchedMaterials.has('Solid Wood') || matchedMaterials.has('Engineered Wood')) {
    matchedMaterials.add('Wood');
  }
  if (matchedMaterials.has('Steel')) {
    matchedMaterials.add('Metal');
  }

  if (matchedMaterials.size === 0) {
    matchedMaterials.add('Wood'); // Default baseline furniture material
  }

  return Array.from(matchedMaterials);
}
