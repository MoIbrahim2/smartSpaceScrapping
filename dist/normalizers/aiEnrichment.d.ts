export interface AIEnrichmentResult {
    embeddingText: string;
    styleLabels: string[];
    dominantColors: string[];
    roomCompatibility: string[];
    keywords: string[];
}
export declare function enrichProductAI(productName: string, description: string, brand: string, category: string, styles: string[], colors: string[], materials: string[], rooms: string[]): AIEnrichmentResult;
