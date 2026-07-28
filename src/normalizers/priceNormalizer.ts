/**
 * Normalizes Egyptian marketplace prices.
 * Parses currency, commas, Arabic numbers, and calculates discounts.
 */
export function normalizePrice(rawPrice: any, rawOriginalPrice?: any): {
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercentage: number;
} {
  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    
    // Clean string from currencies, commas, and spaces
    let str = String(val).trim();
    // Convert Arabic numerals to English
    str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    // Remove commas, EGP, ج.م, and other non-numeric chars except decimal point
    str = str.replace(/,/g, '').replace(/[^\d.]/g, '');
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
  };

  const currentPrice = parseNum(rawPrice);
  let originalPrice = parseNum(rawOriginalPrice);

  if (currentPrice === null) {
    return { currentPrice: null, originalPrice: null, discountPercentage: 0 };
  }

  if (originalPrice === null || originalPrice < currentPrice) {
    originalPrice = currentPrice;
  }

  const discountPercentage = originalPrice > currentPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  return {
    currentPrice,
    originalPrice,
    discountPercentage
  };
}
