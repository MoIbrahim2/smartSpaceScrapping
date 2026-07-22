"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeColors = normalizeColors;
const schema_js_1 = require("../types/schema.js");
const COLOR_KEYWORDS = {
    White: ['white', 'off-white', 'off white', 'أبيض', 'ابيض'],
    Black: ['black', 'dark black', 'أسود', 'اسود'],
    Gray: ['gray', 'grey', 'charcoal', 'رمادي'],
    Brown: ['brown', 'walnut', 'espresso', 'بني', 'جوزي'],
    Beige: ['beige', 'tan', 'بيج'],
    Cream: ['cream', 'creme', 'ivory', 'كريمی', 'كريمي', 'عاجي'],
    Blue: ['blue', 'navy', 'cyan', 'أزرق', 'ازرق', 'كحلي'],
    Green: ['green', 'olive', 'emerald', 'أخضر', 'اخضر', 'زيتي'],
    Red: ['red', 'burgundy', 'maroon', 'أحمر', 'احمر', 'نبيتي'],
    Yellow: ['yellow', 'mustard', 'أصفر', 'اصفر'],
    Orange: ['orange', 'terracotta', 'برتقالي'],
    Pink: ['pink', 'rose', 'blush', 'وردي', 'بمبي'],
    Purple: ['purple', 'violet', 'بنفسجي'],
    Gold: ['gold', 'golden', 'brass', 'ذهبي'],
    Silver: ['silver', 'chrome', 'فضة', 'فضي'],
    'Natural Wood': ['natural wood', 'oak', 'beech', 'teak', 'wood color', 'خشب طبيعي', 'أرو', 'اروع', 'زان'],
};
function normalizeColors(text) {
    const lowerText = text.toLowerCase();
    const matchedColors = new Set();
    for (const color of schema_js_1.ALLOWED_COLORS) {
        const keywords = COLOR_KEYWORDS[color];
        if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
            matchedColors.add(color);
        }
    }
    // Fallback if none matched
    if (matchedColors.size === 0) {
        if (lowerText.includes('wood') || lowerText.includes('خشب')) {
            matchedColors.add('Natural Wood');
        }
        else {
            matchedColors.add('Beige'); // Common neutral default
        }
    }
    return Array.from(matchedColors);
}
