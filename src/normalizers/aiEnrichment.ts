import { UnifiedProduct } from '../types/schema.js';

export interface AIEnrichmentResult {
  embeddingText: string;
  styleLabels: string[];
  dominantColors: string[];
  roomCompatibility: string[];
  keywords: string[];
}

export function enrichProductAI(
  productName: string,
  description: string,
  brand: string,
  category: string,
  styles: string[],
  colors: string[],
  materials: string[],
  rooms: string[]
): AIEnrichmentResult {
  const textCorpus = `${productName} ${brand} ${description} ${category} ${styles.join(' ')} ${colors.join(' ')} ${materials.join(' ')}`.toLowerCase();

  // Extract relevant search keywords
  const rawWords = textCorpus.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').split(/\s+/);
  const stopWords = new Set(['the', 'and', 'for', 'with', 'a', 'an', 'in', 'on', 'of', 'to', 'is', 'من', 'على', 'في', 'مع', 'عن']);
  const keywords = Array.from(
    new Set(rawWords.filter((w) => w.length > 2 && !stopWords.has(w)))
  ).slice(0, 15);

  // Generate synthetic embedding sentence optimized for vector search engines
  const styleDesc = styles.length > 0 ? styles.join('/') : 'Modern';
  const matDesc = materials.length > 0 ? materials.join(' and ') : 'high-quality material';
  const colDesc = colors.length > 0 ? colors.join('/') : 'neutral';
  const roomDesc = rooms.length > 0 ? rooms.join(' and ') : 'home interior';

  const embeddingText = `${styleDesc} ${colDesc} ${matDesc} ${category.toLowerCase()} by ${brand || 'SmartSpace'} ideal for ${roomDesc}. ${productName}. ${description.slice(0, 150)}`.trim();

  return {
    embeddingText,
    styleLabels: styles,
    dominantColors: colors,
    roomCompatibility: rooms,
    keywords,
  };
}
