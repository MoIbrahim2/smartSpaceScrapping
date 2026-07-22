export interface ExtractedDimensions {
    width: number | null;
    height: number | null;
    depth: number | null;
    weight: number | null;
    unit: 'cm';
}
/**
 * Universal Dimension Extractor Engine
 * Extracts dimensions from raw HTML/specs/text, and falls back to Category Default Rules if missing.
 */
export declare function extractDimensions(specs?: Record<string, string>, title?: string, description?: string, category?: string): ExtractedDimensions;
