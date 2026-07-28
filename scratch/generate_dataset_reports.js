const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../product_catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Load Canonical Taxonomy from knowledge_base
const kbDir = path.join(__dirname, '../knowledge_base');
const roomFiles = fs.readdirSync(kbDir).filter(f => f.endsWith('.json'));

const roomTaxonomy = {}; // room -> categories[]
const allCanonicalCategories = new Set();
const categoryToRooms = {}; // category -> rooms[]

roomFiles.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(kbDir, file), 'utf8'));
  const roomKey = file.replace('.json', '');
  const categories = content.rules ? content.rules.map(r => r.category) : [];
  roomTaxonomy[roomKey] = categories;
  categories.forEach(cat => {
    allCanonicalCategories.add(cat);
    if (!categoryToRooms[cat]) categoryToRooms[cat] = [];
    if (!categoryToRooms[cat].includes(roomKey)) categoryToRooms[cat].push(roomKey);
  });
});

console.log(`Loaded ${allCanonicalCategories.size} canonical categories across ${Object.keys(roomTaxonomy).length} room types.`);

// 2. Marketplace distribution
const marketplaceDist = {};
products.forEach(p => {
  const mkt = p.source?.marketplace || 'Unknown';
  marketplaceDist[mkt] = (marketplaceDist[mkt] || 0) + 1;
});

// 3. Raw category breakdown & Schema Inspection
const rawCategoryStats = {};
const schemaFields = {};
const missingStats = {
  missingPrice: 0,
  missingDimensions: 0,
  missingImages: 0,
  missingDescription: 0,
  genericOrNullBrand: 0,
  missingSKU: 0,
  duplicateUrls: 0,
  duplicateExtIds: 0
};

const urlCounts = new Map();
const extIdCounts = new Map();

products.forEach(p => {
  // Schema keys
  Object.keys(p).forEach(k => {
    schemaFields[k] = (schemaFields[k] || 0) + 1;
  });

  // Raw category
  const cat = p.classification?.category || 'Unassigned';
  const sub = p.classification?.subcategory || 'Unassigned';
  const pair = `${cat} > ${sub}`;
  if (!rawCategoryStats[pair]) rawCategoryStats[pair] = { count: 0, marketplace: p.source?.marketplace, samples: [] };
  rawCategoryStats[pair].count++;
  if (rawCategoryStats[pair].samples.length < 5) {
    rawCategoryStats[pair].samples.push(p.basic?.name);
  }

  // Missing data
  if (!p.pricing || p.pricing.currentPrice === null || p.pricing.currentPrice === undefined) missingStats.missingPrice++;
  if (!p.dimensions || (!p.dimensions.width && !p.dimensions.height && !p.dimensions.depth)) missingStats.missingDimensions++;
  if (!p.images || p.images.length === 0) missingStats.missingImages++;
  if (!p.basic?.description || p.basic.description.trim() === '') missingStats.missingDescription++;
  if (!p.basic?.brand || p.basic.brand.includes('Generic') || p.basic.brand.includes('غير محدد')) missingStats.genericOrNullBrand++;
  if (!p.basic?.sku) missingStats.missingSKU++;

  // Duplicates
  const url = p.source?.productUrl;
  if (url) urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
  const extId = p.externalId;
  if (extId) extIdCounts.set(extId, (extIdCounts.get(extId) || 0) + 1);
});

urlCounts.forEach(c => { if (c > 1) missingStats.duplicateUrls += (c - 1); });
extIdCounts.forEach(c => { if (c > 1) missingStats.duplicateExtIds += (c - 1); });

// 4. Test Preliminary Mapping & Categorization
// Rejection patterns for electronics, appliances, consumables, etc.
const rejectionRegex = /(tissue|gloves|mop|cleaner|detergent|scrub|fan|fryer|airfryer|conditioner|grinder|coffee maker|loofah|pillow|pad|apron|insecticide|repellent|heater|waffle|kettle|blender|shaver|clipper|toothbrush|shampoo|soap|towel paper|battery|tv 55|smart tv|led tv|laptop|phone|tablet|headphone|earbud|charging|cable|adapter|refrigerator|fridge|washing machine|dishwasher|microwave|vacuum|iron|cookware|pan|pot|utensil|plate|bowl|cup|mug|knife|fork|spoon|tupperware|storage box plastic|food container|trash can|garbage|bucket|hanger|clothes rack plastic|peg|door mat|shower head|faucet|tap|curtain rod|pillow cover|bed sheet|duvet|blanket|coverlet|candle|flower pot plastic|artificial leaf)/i;

const arabicRejectionRegex = /(مناديل|قفازات|ممسحة|منظف|مسحوق|مروحة|قلاية|قلايه|تكييف|مفرمة|صانع|لوفة|وسادة|مخدة|مخدة|مريلة|مبيد|سخان|وافل|غلاية|خلاط|ماكينة|فرشاة|شامبو|صابون|بطارية|تلفزيون|شاشة|لابتوب|هاتف|سماعة|كابل|ثلاجة|غسالة|غسالة أطباق|مايكروويف|مكنسة|مكواة|أواني|طاسة|حلة|طبق|وعاء|كوب|مج|سكين|شوكة|معلقة|حافظة طعام|سلة قمامة|جردل|شماعة|دواسة|دش|خلاط مياه|مقبض|ملاءة|غطاء لحاف|بطانية|شمعة)/i;

// Mapping proposal helper
const proposedMappings = [];
const mappedCounts = {};
allCanonicalCategories.forEach(c => mappedCounts[c] = 0);
let proposedRejectedCount = 0;
let proposedReviewCount = 0;

Object.entries(rawCategoryStats).forEach(([pair, data]) => {
  let [rawCat, rawSub] = pair.split(' > ');
  let proposedCategory = 'REJECTED';
  let confidence = 'HIGH';
  let targetRooms = [];

  // Match raw pairs
  if (rawCat === 'Bed') { proposedCategory = 'Bed'; targetRooms = ['bedroom']; }
  else if (rawCat === 'Kids Bed') { proposedCategory = 'Kids Bed'; targetRooms = ['kids_room']; }
  else if (rawCat === 'Toilet') { proposedCategory = 'Toilet'; targetRooms = ['bathroom']; }
  else if (rawCat === 'Rug') { proposedCategory = 'Rug'; targetRooms = ['living_room', 'bedroom', 'kids_room', 'dining_room', 'office', 'game_room']; }
  else if (rawCat === 'Mirror') { proposedCategory = 'Mirror'; targetRooms = ['bedroom']; }
  else if (rawCat === 'Sofa') { proposedCategory = 'Sofa'; targetRooms = ['living_room', 'game_room']; }
  else if (rawCat === 'Office Desk') { proposedCategory = 'Office Desk'; targetRooms = ['office']; }
  else if (rawCat === 'Curtains') { proposedCategory = 'Curtains'; targetRooms = ['living_room', 'bedroom', 'dining_room']; }
  else if (rawCat === 'Dining Table') { proposedCategory = 'Dining Table'; targetRooms = ['dining_room']; }
  else if (rawCat === 'Table Lamp') { proposedCategory = 'Table Lamp'; targetRooms = ['bedroom']; }
  else if (rawCat === 'Bookshelf') { proposedCategory = 'Bookshelf'; targetRooms = ['living_room', 'kids_room', 'office']; }
  else if (rawCat === 'LED Lighting') { proposedCategory = 'LED Lighting'; targetRooms = ['game_room']; }
  else if (rawCat === 'Chandelier') { proposedCategory = 'Chandelier'; targetRooms = ['dining_room']; }
  else if (rawCat === 'Wardrobe') { proposedCategory = 'Wardrobe'; targetRooms = ['bedroom']; }
  else if (rawCat === 'Side Table') { proposedCategory = 'Side Table'; targetRooms = ['living_room']; }
  else if (rawCat === 'Storage Rack') { proposedCategory = 'Storage Rack'; targetRooms = ['kitchen']; }
  else if (rawCat === 'Wall Art') { proposedCategory = 'Wall Art'; targetRooms = ['living_room', 'dining_room']; }
  else if (rawCat === 'Night Light') { proposedCategory = 'Night Light'; targetRooms = ['kids_room']; }
  else if (rawCat === 'Countertop') { proposedCategory = 'Countertop'; targetRooms = ['kitchen']; }
  else if (rawCat === 'Swing') { proposedCategory = 'Swing'; targetRooms = ['balcony']; }
  else if (rawCat === 'Kitchen Cabinet Set') { proposedCategory = 'Kitchen Cabinet Set'; targetRooms = ['kitchen']; }
  else if (rawCat === 'TV Unit') { proposedCategory = 'TV Unit'; targetRooms = ['living_room', 'game_room']; }
  else if (rawCat === 'Accessories Set') { proposedCategory = 'Accessories Set'; targetRooms = ['bathroom']; }
  else if (rawCat === 'Shelving') { proposedCategory = 'Shelving'; targetRooms = ['bathroom']; }
  else if (rawCat === 'Storage Unit') {
    // Needs product-level title inspection
    proposedCategory = 'NEEDS_TITLE_FILTERING (Storage Unit / Furniture vs Irrelevant)';
    confidence = 'MEDIUM';
  }

  proposedMappings.push({
    marketplaceCategoryPair: pair,
    marketplace: data.marketplace,
    productCount: data.count,
    proposedCanonicalCategory: proposedCategory,
    targetRooms: targetRooms,
    confidence: confidence,
    sampleProducts: data.samples
  });
});

// Detailed title scan for Storage Unit items
let storageAccepted = 0;
let storageRejected = 0;
let storageReview = 0;

const acceptedStorageKeywords = /(خزانة|دولاب|وحدة تخزين|بوفيه|كومودينو|شيفونيرة|مكتبة|رف خشب|storage cabinet|wooden cabinet|buffet|credenza|sideboard|chest of drawers|dresser|wardrobe|shelving unit|bookcase|cupboard)/i;

products.forEach(p => {
  const cat = p.classification?.category;
  if (cat === 'Storage Unit') {
    const title = p.basic?.name || '';
    if (rejectionRegex.test(title) || arabicRejectionRegex.test(title)) {
      storageRejected++;
      proposedRejectedCount++;
    } else if (acceptedStorageKeywords.test(title)) {
      storageAccepted++;
      mappedCounts['Storage Unit'] = (mappedCounts['Storage Unit'] || 0) + 1;
    } else {
      storageReview++;
      proposedReviewCount++;
    }
  } else {
    // Non-Storage Unit items mapping check
    if (mappedCounts[cat] !== undefined) {
      mappedCounts[cat] += 1;
    } else {
      proposedRejectedCount++;
    }
  }
});

// Prepare JSON & MD report structures
const datasetAnalysisJSON = {
  summary: {
    totalProducts: products.length,
    rootFormat: 'JSON Array',
    marketplaceDistribution: marketplaceDist,
    missingDataStats: missingStats,
    storageUnitBreakdown: {
      totalInStorageCategory: rawCategoryStats['Storage Unit > Storage']?.count || 0,
      estimatedFurnitureStorageAccepted: storageAccepted,
      estimatedIrrelevantStorageRejected: storageRejected,
      estimatedUncertainStorageReview: storageReview
    }
  },
  schema: {
    topLevelFields: Object.keys(schemaFields),
    fieldPresenceCount: schemaFields
  },
  canonicalCategoryCoverage: mappedCounts,
  proposedCategoryMappings: proposedMappings
};

fs.writeFileSync(path.join(__dirname, '../reports/dataset-analysis.json'), JSON.stringify(datasetAnalysisJSON, null, 2));

console.log('dataset-analysis.json successfully generated!');
