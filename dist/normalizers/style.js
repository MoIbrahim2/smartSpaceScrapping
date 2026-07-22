"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStyles = normalizeStyles;
const schema_js_1 = require("../types/schema.js");
const STYLE_KEYWORDS = {
    Modern: ['modern', 'sleek', 'moderne', 'مودرن', 'عصري', 'حديث'],
    Minimalist: ['minimalist', 'minimal', 'simple', 'تبسيطي', 'بسيط'],
    Scandinavian: ['scandinavian', 'scandi', 'nordic', 'اسكندنافي', 'إسكندنافي'],
    Industrial: ['industrial', 'loft', 'raw metal', 'صناعي'],
    Bohemian: ['bohemian', 'boho', 'bOHO', 'بوهيمي', 'بوهيميان'],
    Japandi: ['japandi', 'japan', 'zen', 'ياباندي'],
    Contemporary: ['contemporary', 'معاصر'],
    Luxury: ['luxury', 'luxurious', 'glam', 'gold accent', 'فاخر', 'فخم', 'راقي'],
    Traditional: ['traditional', 'classic arab', 'تقليدي', 'تراثي'],
    Rustic: ['rustic', 'farmhouse', 'reclaimed wood', 'ريفي'],
    Mediterranean: ['mediterranean', 'coastal', 'متوسطي'],
    Classic: ['classic', 'classical', 'antique', 'vintage', 'كلاسيك', 'كلاسيكي'],
    Transitional: ['transitional', 'انتقالي'],
};
function normalizeStyles(text, category) {
    const lowerText = text.toLowerCase();
    const matchedStyles = new Set();
    for (const style of schema_js_1.ALLOWED_STYLES) {
        const keywords = STYLE_KEYWORDS[style];
        if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
            matchedStyles.add(style);
        }
    }
    // Fallback heuristic if no explicit style matched
    if (matchedStyles.size === 0) {
        matchedStyles.add('Modern'); // Default fallback for e-commerce furniture listings
    }
    return Array.from(matchedStyles);
}
