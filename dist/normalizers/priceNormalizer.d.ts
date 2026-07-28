/**
 * Normalizes Egyptian marketplace prices.
 * Parses currency, commas, Arabic numbers, and calculates discounts.
 */
export declare function normalizePrice(rawPrice: any, rawOriginalPrice?: any): {
    currentPrice: number | null;
    originalPrice: number | null;
    discountPercentage: number;
};
