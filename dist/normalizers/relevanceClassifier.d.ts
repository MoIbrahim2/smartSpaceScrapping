export interface ClassificationResult {
    status: 'ACCEPTED' | 'REVIEW' | 'REJECTED';
    canonicalCategory: string;
    roomTypes: string[];
    confidence: number;
    reasons: string[];
}
/**
 * Configuration-driven relevance classifier.
 * Evaluates whether a product is Accepted, Rejected, or needs Review.
 */
export declare function classifyProduct(name: string, rawCategory?: string, description?: string, specifications?: Record<string, string>): ClassificationResult;
