"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandCatalog = expandCatalog;
const aiEnrichment_js_1 = require("./aiEnrichment.js");
const qualityScorer_js_1 = require("./qualityScorer.js");
// Pre-curated high quality furniture image pools for categories
const CATEGORY_IMAGE_POOLS = {
    "Coffee Table": [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80"
    ],
    "Armchair": [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80"
    ],
    "Bedroom Armchair": [
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80"
    ],
    "Nightstand": [
        "https://images.unsplash.com/photo-1532372576444-dda954194ad0?auto=format&fit=crop&w=800&q=80"
    ],
    "Dresser": [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"
    ],
    "Dining Chairs": [
        "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617582907226-c49e2d8200d9?auto=format&fit=crop&w=800&q=80"
    ],
    "Bar Stool": [
        "https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80"
    ],
    "Office Chair": [
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80"
    ],
    "Gaming Chair": [
        "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80"
    ],
    "Study Chair": [
        "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80"
    ],
    "Gaming Desk": [
        "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80"
    ],
    "Bookshelf": [
        "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80"
    ],
    "Buffet Sideboard": [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"
    ],
    "Wall Art": [
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80"
    ],
    "Kitchen Island": [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
    ],
    "Kitchen Cabinet Set": [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
    ],
    "Vanity Unit": [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
    ],
    "Shower Enclosure": [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
    ],
    "Mirror Cabinet": [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
    ],
    "Towel Rack": [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
    ],
    "Bathroom Lighting": [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
    ],
    "Filing Cabinet": [
        "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80"
    ],
    "Whiteboard": [
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"
    ],
    "Sound System Stand": [
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"
    ],
    "Outdoor Seating": [
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80"
    ],
    "Outdoor Table": [
        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80"
    ],
    "Planter": [
        "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80"
    ],
    "Outdoor Rug": [
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80"
    ],
    "Kids Wardrobe": [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"
    ],
    "Wall Decor": [
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80"
    ],
    "Night Light": [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
    ]
};
// Default dimension ranges (width, depth, height) for seed categories
const SEED_DIMENSIONS = {
    "Coffee Table": { width: [90, 110, 130], depth: [50, 60, 70], height: [40, 45, 50] },
    "Armchair": { width: [75, 85, 95], depth: [75, 85, 95], height: [80, 85, 90] },
    "Bedroom Armchair": { width: [70, 80, 90], depth: [70, 80, 90], height: [80, 85, 90] },
    "Nightstand": { width: [45, 50, 55], depth: [40, 45, 50], height: [50, 55, 60] },
    "Dresser": { width: [110, 130, 150], depth: [45, 50, 55], height: [80, 85, 90] },
    "Dining Chairs": { width: [45, 50, 55], depth: [45, 50, 55], height: [85, 90, 95] },
    "Bar Stool": { width: [40, 45, 50], depth: [40, 45, 50], height: [65, 75, 85] },
    "Office Chair": { width: [60, 65, 70], depth: [60, 65, 70], height: [105, 115, 125] },
    "Gaming Chair": { width: [65, 70, 75], depth: [65, 70, 75], height: [120, 130, 140] },
    "Study Chair": { width: [45, 50, 55], depth: [45, 50, 55], height: [80, 85, 90] },
    "Gaming Desk": { width: [120, 140, 160], depth: [60, 70, 80], height: [75, 75, 75] },
    "Bookshelf": { width: [70, 90, 120], depth: [30, 35, 40], height: [160, 180, 200] },
    "Buffet Sideboard": { width: [140, 160, 180], depth: [45, 50, 55], height: [80, 85, 90] },
    "Wall Art": { width: [60, 80, 120], depth: [3, 4, 5], height: [40, 60, 80] },
    "Kitchen Island": { width: [120, 150, 180], depth: [70, 80, 90], height: [85, 90, 95] },
    "Kitchen Cabinet Set": { width: [180, 240, 300], depth: [60, 60, 60], height: [200, 210, 220] },
    "Vanity Unit": { width: [70, 90, 110], depth: [45, 50, 55], height: [80, 85, 90] },
    "Shower Enclosure": { width: [80, 90, 100], depth: [80, 90, 100], height: [190, 200, 210] },
    "Mirror Cabinet": { width: [50, 65, 80], depth: [15, 18, 20], height: [60, 70, 80] },
    "Towel Rack": { width: [50, 60, 75], depth: [12, 15, 20], height: [15, 20, 30] },
    "Bathroom Lighting": { width: [30, 40, 60], depth: [10, 15, 20], height: [10, 15, 20] },
    "Filing Cabinet": { width: [40, 45, 50], depth: [45, 50, 60], height: [70, 100, 130] },
    "Whiteboard": { width: [90, 120, 150], depth: [2, 3, 4], height: [60, 90, 100] },
    "Sound System Stand": { width: [30, 35, 40], depth: [30, 35, 40], height: [60, 80, 100] },
    "Outdoor Seating": { width: [110, 130, 160], depth: [65, 75, 85], height: [75, 80, 85] },
    "Outdoor Table": { width: [70, 90, 120], depth: [70, 80, 90], height: [60, 70, 75] },
    "Planter": { width: [25, 35, 45], depth: [25, 35, 45], height: [30, 45, 60] },
    "Outdoor Rug": { width: [120, 160, 200], depth: [170, 230, 290], height: [1, 1, 1] },
    "Kids Wardrobe": { width: [100, 120, 140], depth: [50, 55, 60], height: [160, 175, 190] },
    "Wall Decor": { width: [40, 60, 80], depth: [2, 4, 6], height: [40, 60, 80] },
    "Night Light": { width: [10, 15, 20], depth: [10, 15, 20], height: [15, 20, 25] }
};
const CATEGORY_ROOM_MAP = {
    "Sofa": ["living_room", "game_room"],
    "Coffee Table": ["living_room"],
    "TV Unit": ["living_room", "game_room"],
    "Curtains": ["living_room", "bedroom", "dining_room"],
    "Side Table": ["living_room"],
    "Rug": ["living_room", "bedroom", "kids_room", "dining_room", "office", "game_room"],
    "Floor Lamp": ["living_room"],
    "Bookshelf": ["living_room", "kids_room", "office"],
    "Wall Art": ["living_room", "dining_room"],
    "Armchair": ["living_room"],
    "Bed": ["bedroom"],
    "Wardrobe": ["bedroom"],
    "Nightstand": ["bedroom"],
    "Dresser": ["bedroom"],
    "Table Lamp": ["bedroom"],
    "Mirror": ["bedroom"],
    "Bedroom Armchair": ["bedroom"],
    "Kids Bed": ["kids_room"],
    "Kids Wardrobe": ["kids_room"],
    "Study Desk": ["kids_room"],
    "Study Chair": ["kids_room"],
    "Storage Unit": ["kids_room", "game_room"],
    "Wall Decor": ["kids_room"],
    "Night Light": ["kids_room"],
    "Dining Table": ["dining_room"],
    "Dining Chairs": ["dining_room"],
    "Buffet Sideboard": ["dining_room"],
    "Chandelier": ["dining_room"],
    "Kitchen Cabinet Set": ["kitchen"],
    "Countertop": ["kitchen"],
    "Kitchen Island": ["kitchen"],
    "Storage Rack": ["kitchen"],
    "Bar Stool": ["kitchen"],
    "Kitchen Lighting": ["kitchen"],
    "Wall Shelf": ["kitchen"],
    "Vanity Unit": ["bathroom"],
    "Shower Enclosure": ["bathroom"],
    "Toilet": ["bathroom"],
    "Mirror Cabinet": ["bathroom"],
    "Shelving": ["bathroom"],
    "Towel Rack": ["bathroom"],
    "Accessories Set": ["bathroom"],
    "Bathroom Lighting": ["bathroom"],
    "Office Desk": ["office"],
    "Office Chair": ["office"],
    "Filing Cabinet": ["office"],
    "Desk Lamp": ["office"],
    "Whiteboard": ["office"],
    "Gaming Desk": ["game_room"],
    "Gaming Chair": ["game_room"],
    "LED Lighting": ["game_room"],
    "Sound System Stand": ["game_room"],
    "Outdoor Seating": ["balcony"],
    "Outdoor Table": ["balcony"],
    "Planter": ["balcony"],
    "Outdoor Lighting": ["balcony"],
    "Outdoor Rug": ["balcony"],
    "Swing": ["balcony"]
};
const SELLER_MAP = {
    "Amazon Egypt": "6a65618b557e76bb4102a095",
    "IKEA Egypt": "6a65618b557e76bb4102a096",
    "Noon Egypt": "6a65618b557e76bb4102a097",
    "Jumia Egypt": "6a65618b557e76bb4102a098"
};
// Target Marketplaces list to distribute synthetic shares across IKEA Egypt, Jumia Egypt, Amazon Egypt, and Noon Egypt
const TARGET_MARKETPLACES = [
    { name: "IKEA Egypt", brand: "IKEA", urlPrefix: "https://www.ikea.com/eg/ar/p" },
    { name: "Jumia Egypt", brand: "Jumia Home", urlPrefix: "https://www.jumia.com.eg" },
    { name: "IKEA Egypt", brand: "IKEA", urlPrefix: "https://www.ikea.com/eg/ar/p" },
    { name: "Jumia Egypt", brand: "Jumia Furnishings", urlPrefix: "https://www.jumia.com.eg" },
    { name: "Amazon Egypt", brand: "Amazon Basics", urlPrefix: "https://www.amazon.eg/dp" },
    { name: "Noon Egypt", brand: "Noon Home", urlPrefix: "https://www.noon.com/egypt-en/p" }
];
// All 58 canonical categories across 9 rooms
const ALL_CANONICAL_CATEGORIES = Object.keys(CATEGORY_ROOM_MAP);
const COLOR_VARIANTS = ["Beige", "White", "Black", "Natural Wood", "Gray", "Brown", "Gold"];
const MATERIAL_VARIANTS = ["Wood", "Solid Wood", "Engineered Wood", "Fabric", "Metal", "Glass", "Velvet"];
const STYLE_VARIANTS = ["Modern", "Scandinavian", "Minimalist", "Contemporary", "Luxury"];
/**
 * Catalog Expander Engine.
 * Expands clean product catalog to ensure 100% taxonomy coverage with 25-30 products per category.
 * Distributes synthesized product shares across IKEA Egypt, Jumia Egypt, Amazon Egypt, and Noon Egypt.
 */
function expandCatalog(existingCleanProducts, targetPerCategory = 25) {
    console.log(`Expanding catalog to ensure all ${ALL_CANONICAL_CATEGORIES.length} categories reach at least ${targetPerCategory} items...`);
    // Group existing products by canonical category
    const categoryGroups = {};
    ALL_CANONICAL_CATEGORIES.forEach(cat => categoryGroups[cat] = []);
    existingCleanProducts.forEach(p => {
        const cat = p.classification.canonicalCategory;
        if (!categoryGroups[cat])
            categoryGroups[cat] = [];
        categoryGroups[cat].push(p);
    });
    const expandedList = [...existingCleanProducts];
    let syntheticIdCounter = 1;
    ALL_CANONICAL_CATEGORIES.forEach(category => {
        const currentItems = categoryGroups[category] || [];
        const needed = Math.max(0, targetPerCategory - currentItems.length);
        if (needed === 0)
            return;
        // Collect image pool for this category
        let imagePool = currentItems
            .filter(p => p.images && p.images.length > 0)
            .map(p => p.images);
        if (imagePool.length === 0) {
            const fallbackUrls = CATEGORY_IMAGE_POOLS[category] || [
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
            ];
            imagePool = [fallbackUrls.map((url, idx) => ({ url, isPrimary: idx === 0 }))];
        }
        for (let i = 0; i < needed; i++) {
            syntheticIdCounter++;
            const idStr = `AUG-${category.toUpperCase().replace(/\s+/g, '-')}-${String(syntheticIdCounter).padStart(4, '0')}`;
            // Select template base product or synthetic seed
            const template = currentItems.length > 0 ? currentItems[i % currentItems.length] : null;
            const images = imagePool[i % imagePool.length];
            // Assign marketplace share across IKEA, Jumia, Amazon, Noon
            const mktConfig = TARGET_MARKETPLACES[syntheticIdCounter % TARGET_MARKETPLACES.length];
            const marketplaceName = mktConfig.name;
            const brandName = mktConfig.brand;
            const slugCat = category.toLowerCase().replace(/\s+/g, '-');
            const productUrl = `${mktConfig.urlPrefix}/${slugCat}-${idStr.toLowerCase()}`;
            const selectedColor = COLOR_VARIANTS[(i + syntheticIdCounter) % COLOR_VARIANTS.length];
            const selectedMaterial = MATERIAL_VARIANTS[(i + syntheticIdCounter) % MATERIAL_VARIANTS.length];
            const selectedStyle = STYLE_VARIANTS[(i + syntheticIdCounter) % STYLE_VARIANTS.length];
            const targetRooms = CATEGORY_ROOM_MAP[category] || ["living_room"];
            let width, depth, height, price, name, desc;
            if (template) {
                // Variant based on real scraped item
                const baseW = template.dimensions.width || 120;
                const baseD = template.dimensions.length || 60;
                const baseH = template.dimensions.height || 75;
                const baseP = template.pricing.currentPrice || 2500;
                // Vary dimensions within 10-20%
                const scale = 0.9 + (i % 5) * 0.05; // 0.9, 0.95, 1.0, 1.05, 1.1
                width = Math.round(baseW * scale);
                depth = Math.round(baseD * scale);
                height = Math.round(baseH);
                price = Math.round(baseP * scale);
                const colorLabel = selectedColor;
                name = `${template.basic.name} - ${colorLabel} Edition (${width}x${depth} cm)`;
                desc = `${template.basic.description} Crafted in ${selectedMaterial} with a ${selectedStyle} finish. Dimensions: ${width} W x ${depth} D x ${height} H cm. Compatible with ${targetRooms.join(', ')}.`;
            }
            else {
                // Synthetic seed for missing category
                const dimsConf = SEED_DIMENSIONS[category] || { width: [100, 120, 140], depth: [50, 60, 70], height: [75, 75, 75] };
                width = dimsConf.width[i % dimsConf.width.length];
                depth = dimsConf.depth[i % dimsConf.depth.length];
                height = dimsConf.height[i % dimsConf.height.length];
                const basePrices = {
                    "Coffee Table": 2200, "Armchair": 4500, "Nightstand": 1400, "Dresser": 5500,
                    "Dining Chairs": 1800, "Bar Stool": 1600, "Office Chair": 3200, "Gaming Chair": 5800,
                    "Study Chair": 1500, "Gaming Desk": 4800, "Bookshelf": 3500, "Buffet Sideboard": 7500,
                    "Wall Art": 950, "Kitchen Island": 8500, "Vanity Unit": 6200, "Shower Enclosure": 8900
                };
                const baseP = basePrices[category] || 2000;
                price = Math.round(baseP * (0.85 + (i % 4) * 0.1));
                const isArabic = i % 2 === 1;
                if (isArabic) {
                    name = `${category} مودرن خشب ${selectedColor} - مقاس ${width} × ${depth} سم`;
                    desc = `${category} عصرية مصنوعة من ${selectedMaterial} عالي الجودة بتصميم ${selectedStyle}. المناسبة لغرفة ${targetRooms.join(', ')}. الأبعاد: ${width} عرض × ${depth} عمق × ${height} ارتفاع سم.`;
                }
                else {
                    name = `${selectedStyle} ${selectedColor} ${category} (${width}x${depth} cm)`;
                    desc = `Premium ${selectedStyle} ${category} crafted with high-durability ${selectedMaterial} in a ${selectedColor} finish. Dimensions: ${width} W x ${depth} D x ${height} H cm. Ideal for ${targetRooms.join(' and ')}.`;
                }
            }
            const origPrice = Math.round(price * 1.15);
            const discount = Math.round(((origPrice - price) / origPrice) * 100);
            const aiData = (0, aiEnrichment_js_1.enrichProductAI)(name, desc, brandName, category, [selectedStyle], [selectedColor], [selectedMaterial], targetRooms);
            const sellerId = SELLER_MAP[marketplaceName] || "6a65618b557e76bb4102a095";
            const newProduct = {
                externalId: idStr,
                sellerId: sellerId,
                source: {
                    marketplace: marketplaceName,
                    sellerId: sellerId,
                    productUrl,
                    country: 'Egypt',
                    scrapedAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                },
                basic: {
                    name,
                    brand: brandName,
                    description: desc,
                    sku: idStr
                },
                classification: {
                    canonicalCategory: category,
                    roomTypes: targetRooms,
                    styles: [selectedStyle],
                    materials: [selectedMaterial],
                    colors: [selectedColor],
                    tags: [category, selectedStyle, selectedColor, selectedMaterial]
                },
                pricing: {
                    currency: 'EGP',
                    currentPrice: price,
                    originalPrice: origPrice,
                    discountPercentage: discount
                },
                dimensions: {
                    width,
                    height,
                    length: depth,
                    dimensionUnit: 'cm',
                    weight: Math.round(width * depth * 0.003 * 10) / 10,
                    weightUnit: 'kg'
                },
                images,
                availability: {
                    inStock: true,
                    stockStatus: 'In Stock'
                },
                rating: {
                    average: 4.5 + (i % 5) * 0.1,
                    reviews: 12 + (i * 7)
                },
                ai: {
                    embeddingText: aiData.embeddingText,
                    styleLabels: aiData.styleLabels,
                    dominantColors: aiData.dominantColors,
                    roomCompatibility: aiData.roomCompatibility,
                    keywords: aiData.keywords
                },
                processing: {
                    status: 'ACCEPTED',
                    categoryConfidence: 0.98,
                    qualityScore: 92,
                    issues: [],
                    normalizationVersion: '1.0'
                }
            };
            // Calculate quality score
            const qRes = (0, qualityScorer_js_1.calculateQualityScore)(newProduct, category);
            newProduct.processing.qualityScore = qRes.score;
            expandedList.push(newProduct);
        }
    });
    console.log(`Expansion Complete! Catalog grown from ${existingCleanProducts.length} to ${expandedList.length} products.`);
    return expandedList;
}
