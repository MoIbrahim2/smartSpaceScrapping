import { UnifiedProduct } from '../types/schema.js';
export interface DuplicateGroup {
    primaryProductId: string;
    marketplace: string;
    candidateProductIds: {
        externalId: string;
        name: string;
        marketplace: string;
        similarityReason: string;
    }[];
}
/**
 * Multi-level duplicate detector.
 * 1. Merges exact duplicates (Level 1 & Level 2 matching SKU) automatically.
 * 2. Identifies cross-marketplace fuzzy matches (Level 3) and creates duplicate candidates reference mapping.
 */
export declare function detectAndProcessDuplicates(products: UnifiedProduct[]): {
    mergedProducts: UnifiedProduct[];
    duplicateCandidatesReport: DuplicateGroup[];
};
