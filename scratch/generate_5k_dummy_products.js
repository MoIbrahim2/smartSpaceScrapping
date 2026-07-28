const fs = require('fs');
const path = require('path');

// 1. Load baseline cleaned products
const cleanedFilePath = path.join(__dirname, '../output/products_clean_3d.json');
const existingProducts = JSON.parse(fs.readFileSync(cleanedFilePath, 'utf8'));

console.log(`Loaded ${existingProducts.length} existing cleaned products.`);

// Taxonomy of Rooms and Categories
const ROOM_CATEGORIES = [
  { room: 'living_room', categories: ['Sofa', 'Coffee Table', 'TV Unit', 'Curtains', 'Side Table', 'Rug', 'Floor Lamp', 'Bookshelf', 'Wall Art', 'Armchair'] },
  { room: 'bedroom', categories: ['Bed', 'Wardrobe', 'Nightstand', 'Dresser', 'Curtains', 'Rug', 'Table Lamp', 'Mirror', 'Bedroom Armchair'] },
  { room: 'kids_room', categories: ['Kids Bed', 'Kids Wardrobe', 'Study Desk', 'Study Chair', 'Bookshelf', 'Rug', 'Storage Unit', 'Wall Decor', 'Night Light'] },
  { room: 'dining_room', categories: ['Dining Table', 'Dining Chairs', 'Buffet Sideboard', 'Chandelier', 'Rug', 'Curtains', 'Wall Art'] },
  { room: 'kitchen', categories: ['Kitchen Cabinet Set', 'Countertop', 'Kitchen Island', 'Storage Rack', 'Bar Stool', 'Kitchen Lighting', 'Wall Shelf'] },
  { room: 'bathroom', categories: ['Vanity Unit', 'Shower Enclosure', 'Toilet', 'Mirror Cabinet', 'Shelving', 'Towel Rack', 'Accessories Set', 'Bathroom Lighting'] },
  { room: 'office', categories: ['Office Desk', 'Office Chair', 'Bookshelf', 'Filing Cabinet', 'Desk Lamp', 'Rug', 'Whiteboard'] },
  { room: 'game_room', categories: ['Gaming Desk', 'Gaming Chair', 'TV Unit', 'Sofa', 'Storage Unit', 'LED Lighting', 'Rug', 'Sound System Stand'] },
  { room: 'balcony', categories: ['Outdoor Seating', 'Outdoor Table', 'Planter', 'Outdoor Lighting', 'Outdoor Rug', 'Swing'] }
];

const STYLES = ['Modern', 'Minimalist', 'Scandinavian', 'Industrial', 'Bohemian', 'Japandi', 'Contemporary', 'Luxury', 'Traditional', 'Rustic', 'Mediterranean', 'Classic', 'Transitional'];
const COLORS = ['White', 'Black', 'Gray', 'Brown', 'Beige', 'Cream', 'Blue', 'Green', 'Red', 'Yellow', 'Orange', 'Pink', 'Purple', 'Gold', 'Silver', 'Natural Wood', 'Multicolor'];
const MATERIALS = ['Wood', 'Solid Wood', 'Engineered Wood', 'Metal', 'Steel', 'Glass', 'Plastic', 'Fabric', 'Velvet', 'Leather', 'Faux Leather', 'Marble', 'Stone', 'Ceramic', 'Concrete', 'Rattan'];

const BRANDS = ['Ikea', 'Hub Furniture', 'InHouse', 'Pottery Barn', 'Ashley Furniture', 'Home Centre', 'SmartSpace Design', 'Defacto Home', 'Kabbani Furniture', 'Generic', 'Concept Furniture', 'Urban Wood', 'Luxe Design', 'Modern Living'];

const ADJECTIVES = ['Sleek', 'Premium', 'Ergonomic', 'Minimalist', 'Handcrafted', 'Luxury', 'Compact', 'Modular', 'Nordic', 'Vintage', 'Contemporary', 'Cozy', 'Elegant', 'Sturdy', 'Ultra-Comfort'];

// Category dimension ranges & weight baseline (in cm and kg)
const CATEGORY_SPECS = {
  'Bed': { w: [140, 200], l: [190, 210], h: [90, 130], wt: [45, 95], price: [6000, 35000] },
  'Kids Bed': { w: [90, 120], l: [180, 200], h: [80, 110], wt: [25, 55], price: [4000, 18000] },
  'Sofa': { w: [160, 280], l: [80, 105], h: [75, 95], wt: [40, 90], price: [8000, 45000] },
  'Armchair': { w: [75, 105], l: [75, 95], h: [80, 105], wt: [18, 38], price: [3500, 15000] },
  'Bedroom Armchair': { w: [70, 95], l: [70, 90], h: [80, 100], wt: [16, 32], price: [3200, 13500] },
  'Coffee Table': { w: [90, 140], l: [50, 85], h: [40, 52], wt: [12, 35], price: [1500, 9500] },
  'Side Table': { w: [40, 65], l: [40, 60], h: [45, 65], wt: [6, 18], price: [800, 4500] },
  'Nightstand': { w: [45, 65], l: [40, 55], h: [50, 65], wt: [8, 22], price: [950, 5500] },
  'Dining Table': { w: [140, 240], L: [80, 115], h: [74, 78], wt: [35, 85], price: [5500, 38000] },
  'Dining Chairs': { w: [45, 60], l: [45, 60], h: [80, 105], wt: [5, 14], price: [800, 4500] },
  'Buffet Sideboard': { w: [130, 200], l: [40, 55], h: [75, 95], wt: [40, 80], price: [6500, 28000] },
  'Wardrobe': { w: [140, 260], l: [55, 68], h: [190, 240], wt: [70, 160], price: [12000, 65000] },
  'Kids Wardrobe': { w: [100, 160], l: [50, 60], h: [160, 200], wt: [45, 90], price: [6500, 25000] },
  'Dresser': { w: [100, 160], l: [42, 55], h: [75, 95], wt: [35, 75], price: [4500, 22000] },
  'TV Unit': { w: [140, 240], l: [35, 50], h: [42, 65], wt: [22, 55], price: [2500, 18000] },
  'Office Desk': { w: [120, 180], l: [60, 85], h: [73, 78], wt: [20, 50], price: [3000, 19000] },
  'Study Desk': { w: [100, 140], l: [50, 70], h: [73, 78], wt: [15, 35], price: [2200, 12000] },
  'Gaming Desk': { w: [120, 160], l: [60, 80], h: [73, 78], wt: [22, 45], price: [3500, 16000] },
  'Office Chair': { w: [60, 75], l: [60, 75], h: [110, 135], wt: [12, 24], price: [1800, 12000] },
  'Study Chair': { w: [50, 65], l: [50, 65], h: [90, 115], wt: [8, 16], price: [1200, 7500] },
  'Gaming Chair': { w: [65, 75], l: [65, 75], h: [120, 140], wt: [16, 28], price: [4000, 19000] },
  'Bookshelf': { w: [70, 140], l: [30, 45], h: [150, 210], wt: [18, 55], price: [2000, 14000] },
  'Shelving': { w: [60, 120], l: [25, 40], h: [120, 190], wt: [10, 35], price: [1200, 8500] },
  'Storage Unit': { w: [60, 120], l: [35, 50], h: [80, 150], wt: [15, 45], price: [1500, 9500] },
  'Storage Rack': { w: [60, 110], l: [30, 45], h: [100, 180], wt: [8, 25], price: [800, 4500] },
  'Filing Cabinet': { w: [45, 90], l: [45, 60], h: [70, 140], wt: [20, 55], price: [2500, 11000] },
  'Rug': { w: [120, 260], l: [180, 350], h: [1, 3], wt: [4, 15], price: [900, 8500] },
  'Outdoor Rug': { w: [120, 240], l: [180, 320], h: [1, 2], wt: [3, 10], price: [850, 6500] },
  'Curtains': { w: [140, 300], l: [5, 10], h: [200, 300], wt: [1.5, 5], price: [600, 4500] },
  'Mirror': { w: [50, 100], l: [3, 8], h: [70, 170], wt: [4, 18], price: [800, 6500] },
  'Mirror Cabinet': { w: [50, 90], l: [15, 25], h: [60, 90], wt: [8, 22], price: [1500, 7500] },
  'Wall Art': { w: [40, 120], l: [2, 5], h: [50, 120], wt: [2, 10], price: [450, 3500] },
  'Wall Decor': { w: [30, 90], l: [2, 6], h: [30, 90], wt: [1, 6], price: [350, 2500] },
  'Wall Shelf': { w: [50, 120], l: [15, 30], h: [15, 40], wt: [3, 12], price: [400, 2200] },
  'Whiteboard': { w: [90, 180], l: [2, 5], h: [60, 120], wt: [4, 15], price: [600, 3500] },
  'Floor Lamp': { w: [35, 55], l: [35, 55], h: [140, 180], wt: [4, 12], price: [1100, 5500] },
  'Table Lamp': { w: [25, 40], l: [25, 40], h: [40, 65], wt: [2, 6], price: [500, 2800] },
  'Desk Lamp': { w: [18, 35], l: [18, 35], h: [35, 55], wt: [1.5, 4.5], price: [400, 2200] },
  'Night Light': { w: [10, 20], l: [10, 20], h: [15, 30], wt: [0.3, 1.5], price: [200, 1200] },
  'Chandelier': { w: [45, 90], l: [45, 90], h: [50, 110], wt: [5, 22], price: [2500, 18000] },
  'LED Lighting': { w: [20, 120], l: [5, 15], h: [5, 20], wt: [0.5, 3], price: [350, 2800] },
  'Outdoor Lighting': { w: [15, 35], l: [15, 35], h: [25, 80], wt: [1.5, 6], price: [450, 3200] },
  'Kitchen Lighting': { w: [30, 90], l: [15, 30], h: [15, 45], wt: [1.5, 5], price: [500, 3500] },
  'Bathroom Lighting': { w: [30, 80], l: [10, 20], h: [10, 25], wt: [1, 4], price: [450, 3000] },
  'Vanity Unit': { w: [80, 160], l: [45, 60], h: [80, 90], wt: [30, 85], price: [4500, 26000] },
  'Shower Enclosure': { w: [80, 120], l: [80, 120], h: [190, 210], wt: [45, 95], price: [6000, 24000] },
  'Toilet': { w: [36, 42], l: [65, 75], h: [70, 85], wt: [28, 48], price: [2200, 9500] },
  'Towel Rack': { w: [40, 80], l: [10, 25], h: [20, 80], wt: [1.5, 6], price: [350, 2200] },
  'Accessories Set': { w: [20, 40], l: [20, 40], h: [15, 30], wt: [1, 5], price: [400, 2500] },
  'Kitchen Cabinet Set': { w: [160, 320], l: [60, 70], h: [200, 240], wt: [90, 250], price: [18000, 85000] },
  'Countertop': { w: [120, 240], l: [60, 70], h: [4, 8], wt: [30, 90], price: [3500, 18000] },
  'Kitchen Island': { w: [140, 220], l: [80, 110], h: [88, 95], wt: [60, 140], price: [11000, 48000] },
  'Bar Stool': { w: [40, 52], l: [40, 52], h: [85, 110], wt: [6, 15], price: [900, 4800] },
  'Outdoor Seating': { w: [120, 220], l: [70, 95], h: [75, 95], wt: [20, 60], price: [4500, 28000] },
  'Outdoor Table': { w: [90, 180], l: [70, 100], h: [70, 76], wt: [14, 45], price: [2800, 16000] },
  'Planter': { w: [25, 50], l: [25, 50], h: [30, 80], wt: [3, 16], price: [350, 2500] },
  'Swing': { w: [100, 160], l: [90, 130], h: [180, 210], wt: [25, 55], price: [4200, 19000] },
  'Sound System Stand': { w: [45, 90], l: [40, 50], h: [60, 110], wt: [10, 28], price: [1200, 6500] }
};

// Image placeholder pool
const IMAGE_POOL = [
  "https://m.media-amazon.com/images/I/41DWj1bhKeL._AC_SL1000_.jpg",
  "https://m.media-amazon.com/images/I/51x8B7L7zGL._AC_SL1000_.jpg",
  "https://m.media-amazon.com/images/I/61N+T-YkHBL._AC_SL1200_.jpg",
  "https://m.media-amazon.com/images/I/51e2W7t1AEL._AC_SL1000_.jpg",
  "https://m.media-amazon.com/images/I/41K99gR18IL._AC_SL1000_.jpg",
  "https://m.media-amazon.com/images/I/51wJ5rK9g0L._AC_SL1000_.jpg",
  "https://m.media-amazon.com/images/I/41Q8J4g56nL._AC_SL1000_.jpg"
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Target product count
const TARGET_TOTAL = 5200;
const syntheticNeeded = TARGET_TOTAL - existingProducts.length;

console.log(`Generating ${syntheticNeeded} synthetic products to reach total of ${TARGET_TOTAL}...`);

// Generate list of all room-category combinations
const categoryRoomPairs = [];
ROOM_CATEGORIES.forEach(rc => {
  rc.categories.forEach(cat => {
    categoryRoomPairs.push({ room: rc.room, category: cat });
  });
});

const syntheticProducts = [];

for (let i = 0; i < syntheticNeeded; i++) {
  const pair = categoryRoomPairs[i % categoryRoomPairs.length];
  const category = pair.category;
  const room = pair.room;

  const style = getRandom(STYLES);
  const secondaryStyle = getRandom(STYLES.filter(s => s !== style));
  const color = getRandom(COLORS);
  const material = getRandom(MATERIALS);
  const brand = getRandom(BRANDS);
  const adj = getRandom(ADJECTIVES);

  const spec = CATEGORY_SPECS[category] || { w: [60, 140], l: [50, 100], h: [50, 120], wt: [10, 40], price: [1000, 10000] };
  const width = getRandomNum(spec.w[0], spec.w[1]);
  const length = getRandomNum((spec.l || spec.w)[0], (spec.l || spec.w)[1]);
  const height = getRandomNum(spec.h[0], spec.h[1]);
  const weight = getRandomFloat(spec.wt[0], spec.wt[1], 1);

  const basePrice = getRandomNum(spec.price[0], spec.price[1]);
  const hasDiscount = Math.random() > 0.4;
  const discountPct = hasDiscount ? getRandomNum(5, 35) : 0;
  const originalPrice = Math.round(basePrice * (1 + discountPct / 100));

  const extId = `DUMMY_${category.replace(/[^a-zA-Z]/g, '').toUpperCase()}_${String(i + 1).padStart(5, '0')}`;

  const englishName = `${adj} ${style} ${color} ${category} (${width}x${length}x${height} cm)`;
  const arabicName = `${category} ${style} فاخر لون ${color} من ${material} مقاس ${width}×${length} سم`;

  const title = Math.random() > 0.3 ? `${englishName} | ${arabicName}` : `${arabicName} - ${englishName}`;

  const description = `عن هذه السلعة: ${arabicName}. مصنع من أجود أنواع ${material} بتصميم ${style} مناسب لـ ${room}. الأبعاد: ${width} × ${length} × ${height} سم، الوزن: ${weight} كجم. الماركة: ${brand}.`;

  const primaryImg = getRandom(IMAGE_POOL);
  const secondaryImg = getRandom(IMAGE_POOL);

  const product = {
    externalId: extId,
    source: {
      marketplace: "SmartSpace Synthetic Catalog",
      productUrl: `https://www.smartspace.ai/products/${extId}`,
      country: "Egypt",
      scrapedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sellerId: "seller_smartspace_synth"
    },
    basic: {
      name: title,
      brand: brand,
      description: description,
      sku: extId
    },
    classification: {
      canonicalCategory: category,
      roomTypes: [room],
      styles: Array.from(new Set([style, secondaryStyle])),
      materials: [material],
      colors: [color],
      tags: [category, style, color, material, room]
    },
    pricing: {
      currency: "EGP",
      currentPrice: basePrice,
      originalPrice: originalPrice,
      discountPercentage: discountPct
    },
    dimensions: {
      width: width,
      height: height,
      length: length,
      dimensionUnit: "cm",
      weight: weight,
      weightUnit: "kg"
    },
    images: [
      { url: primaryImg, isPrimary: true },
      { url: secondaryImg, isPrimary: false }
    ],
    availability: {
      inStock: true,
      stockStatus: "In Stock"
    },
    rating: {
      average: getRandomFloat(3.8, 4.9, 1),
      reviews: getRandomNum(5, 280)
    },
    ai: {
      embeddingText: `${style} ${color} ${material} ${category} ideal for ${room}. ${title}. ${description}`,
      styleLabels: [style, secondaryStyle],
      dominantColors: [color],
      roomCompatibility: [room],
      keywords: [category.toLowerCase(), style.toLowerCase(), color.toLowerCase(), material.toLowerCase(), room]
    },
    processing: {
      status: "ACCEPTED",
      categoryConfidence: getRandomFloat(0.88, 1.00, 2),
      qualityScore: getRandomNum(82, 98),
      issues: [],
      normalizationVersion: "1.0"
    },
    sellerId: "seller_smartspace_synth"
  };

  syntheticProducts.push(product);
}

const fullDataset = [...existingProducts, ...syntheticProducts];

console.log(`Final combined dataset product count: ${fullDataset.length}`);

// Save output files
const dummyFilePath = path.join(__dirname, '../output/products_dummy_5k.json');
const clean3d5kFilePath = path.join(__dirname, '../output/products_clean_3d_5k.json');

fs.writeFileSync(dummyFilePath, JSON.stringify(fullDataset, null, 2), 'utf8');
fs.writeFileSync(clean3d5kFilePath, JSON.stringify(fullDataset, null, 2), 'utf8');

console.log(`Saved ${fullDataset.length} products to:`);
console.log(`- ${dummyFilePath}`);
console.log(`- ${clean3d5kFilePath}`);
