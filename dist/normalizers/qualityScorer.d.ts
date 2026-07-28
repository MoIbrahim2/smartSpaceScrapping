export interface QualityResult {
    score: number;
    qualityLevel: 'EXCELLENT' | 'GOOD' | 'INCOMPLETE' | 'POOR';
    issues: string[];
}
/**
 * Calculates a quality score from 0-100 for normalized products.
 */
export declare function calculateQualityScore(product: any, category: string): QualityResult;
