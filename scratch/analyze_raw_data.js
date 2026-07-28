const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../product_catalog.json');

console.log('Reading product catalog...');
const rawContent = fs.readFileSync(catalogPath, 'utf8');

let products = [];
if (rawContent.trim().startsWith('[')) {
  console.log('Format detected: JSON Array');
  products = JSON.parse(rawContent);
} else {
  console.log('Format detected: JSONL');
  products = rawContent.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
}

console.log(`Total Products: ${products.length}`);

// Sample 5 products to inspect schema
console.log('\n--- SAMPLE PRODUCT STRUCTURE ---');
console.log(JSON.stringify(products[0], null, 2));

// Statistics containers
const marketplaceCount = {};
const categoryCount = {};
const marketplaceCategoryMap = {}; // marketplace -> { category: count }
const schemaFields = new Set();
const missingFieldsStats = {};
const priceStats = { missing: 0, present: 0, sampleFormats: [] };
const dimensionStats = { missing: 0, present: 0, sampleFormats: [] };
const imageStats = { missing: 0, present: 0, maxImages: 0 };
const duplicateExternalIds = new Map();
const duplicateUrls = new Map();

products.forEach((p, idx) => {
  // Extract marketplace
  const mkt = p.source?.marketplace || p.marketplace || 'unknown';
  marketplaceCount[mkt] = (marketplaceCount[mkt] || 0) + 1;

  // Extract category / breadcrumbs
  const mktCategory = p.rawCategory || p.category || (p.breadcrumbs ? p.breadcrumbs.join(' > ') : 'UNKNOWN');
  const catKey = `${mkt} > ${mktCategory}`;
  categoryCount[catKey] = (categoryCount[catKey] || 0) + 1;

  if (!marketplaceCategoryMap[mkt]) marketplaceCategoryMap[mkt] = {};
  marketplaceCategoryMap[mkt][mktCategory] = (marketplaceCategoryMap[mkt][mktCategory] || 0) + 1;

  // Track fields
  Object.keys(p).forEach(k => schemaFields.add(k));

  // Duplicates
  const extId = p.externalId || p.id;
  if (extId) {
    if (!duplicateExternalIds.has(extId)) duplicateExternalIds.set(extId, []);
    duplicateExternalIds.get(extId).push(idx);
  }
  const url = p.source?.productUrl || p.productUrl || p.url;
  if (url) {
    if (!duplicateUrls.has(url)) duplicateUrls.set(url, []);
    duplicateUrls.get(url).push(idx);
  }

  // Price
  const priceVal = p.pricing?.currentPrice ?? p.price ?? p.rawPrice;
  if (priceVal === null || priceVal === undefined || priceVal === '') {
    priceStats.missing++;
  } else {
    priceStats.present++;
    if (priceStats.sampleFormats.length < 20) {
      priceStats.sampleFormats.push({ marketplace: mkt, val: priceVal });
    }
  }

  // Dimensions
  const dims = p.dimensions || p.rawDimensions || p.specifications?.Dimensions || p.attributes?.dimensions;
  const hasDim = dims && (typeof dims === 'object' ? Object.values(dims).some(v => v !== null) : String(dims).trim().length > 0);
  if (!hasDim) {
    dimensionStats.missing++;
  } else {
    dimensionStats.present++;
    if (dimensionStats.sampleFormats.length < 20) {
      dimensionStats.sampleFormats.push({ marketplace: mkt, val: dims });
    }
  }

  // Images
  const imgs = p.images || p.imageUrls || p.image;
  if (!imgs || (Array.isArray(imgs) && imgs.length === 0)) {
    imageStats.missing++;
  } else {
    imageStats.present++;
    const count = Array.isArray(imgs) ? imgs.length : 1;
    if (count > imageStats.maxImages) imageStats.maxImages = count;
  }
});

console.log('\n--- MARKETPLACE DISTRIBUTION ---');
console.log(marketplaceCount);

console.log('\n--- DATA ACCESSIBILITY / MISSING STATS ---');
console.log(`Prices present: ${priceStats.present}, missing: ${priceStats.missing}`);
console.log(`Dimensions present: ${dimensionStats.present}, missing: ${dimensionStats.missing}`);
console.log(`Images present: ${imageStats.present}, missing: ${imageStats.missing}`);

let dupExtIdCount = 0;
duplicateExternalIds.forEach(arr => { if (arr.length > 1) dupExtIdCount += (arr.length - 1); });
let dupUrlCount = 0;
duplicateUrls.forEach(arr => { if (arr.length > 1) dupUrlCount += (arr.length - 1); });

console.log(`Duplicate External IDs (extra occurrences): ${dupExtIdCount}`);
console.log(`Duplicate Product URLs (extra occurrences): ${dupUrlCount}`);
