const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../product_catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. Marketplace Distribution
const mktDist = {};
products.forEach(p => {
  const m = p.source?.marketplace || 'Unknown';
  mktDist[m] = (mktDist[m] || 0) + 1;
});

// 2. Categories per Marketplace
const mktCats = {};
products.forEach(p => {
  const m = p.source?.marketplace || 'Unknown';
  const cat = p.classification?.category || 'NONE';
  const sub = p.classification?.subcategory || 'NONE';
  const key = `${cat} > ${sub}`;
  if (!mktCats[m]) mktCats[m] = {};
  mktCats[m][key] = (mktCats[m][key] || 0) + 1;
});

// 3. Check all raw categories across the entire dataset
const rawCatCounts = {};
products.forEach(p => {
  const cat = p.classification?.category || 'NONE';
  const sub = p.classification?.subcategory || 'NONE';
  const full = `${cat} | ${sub}`;
  rawCatCounts[full] = (rawCatCounts[full] || 0) + 1;
});

// 4. Missing / Null Fields
const nullFieldCounts = {
  brand_generic_or_null: 0,
  description_missing: 0,
  sku_missing: 0,
  currentPrice_missing: 0,
  originalPrice_missing: 0,
  discountPercentage_zero_or_null: 0,
  dimensions_all_zero_or_null: 0,
  rating_missing: 0,
  rating_reviews_zero: 0,
  images_empty: 0,
};

// 5. Sample inspect for duplicates
const urlMap = new Map();
products.forEach((p, idx) => {
  const url = p.source?.productUrl;
  if (url) {
    if (!urlMap.has(url)) urlMap.set(url, []);
    urlMap.get(url).push({ idx, name: p.basic?.name, extId: p.externalId, mkt: p.source?.marketplace });
  }
});

let duplicateUrlGroups = 0;
let totalDuplicateUrlEntries = 0;
urlMap.forEach(list => {
  if (list.length > 1) {
    duplicateUrlGroups++;
    totalDuplicateUrlEntries += list.length;
  }
});

// 6. Dimension anomalies check
let dimAnomalies = 0;
products.forEach(p => {
  const d = p.dimensions;
  if (!d) nullFieldCounts.dimensions_all_zero_or_null++;
  else {
    if ((d.width === 0 && d.height === 0 && d.depth === 0) || (!d.width && !d.height && !d.depth)) {
      nullFieldCounts.dimensions_all_zero_or_null++;
    }
    // Check weird dimensions e.g. width > 500
    if (d.width > 500 || d.height > 500 || d.depth > 500) {
      dimAnomalies++;
    }
  }

  if (!p.basic?.description || p.basic.description.trim() === '') nullFieldCounts.description_missing++;
  if (!p.basic?.brand || p.basic.brand.includes('Generic') || p.basic.brand.includes('غير محدد')) nullFieldCounts.brand_generic_or_null++;
  if (!p.basic?.sku) nullFieldCounts.sku_missing++;
  if (!p.pricing?.currentPrice) nullFieldCounts.currentPrice_missing++;
  if (!p.rating || p.rating.average === null) nullFieldCounts.rating_missing++;
  if (!p.rating || p.rating.reviews === 0) nullFieldCounts.rating_reviews_zero++;
});

// Write analysis JSON summary
const summary = {
  totalProducts: products.length,
  marketplaceDistribution: mktDist,
  rawCategoriesCounts: rawCatCounts,
  categoriesByMarketplace: mktCats,
  nullAndMissingStats: nullFieldCounts,
  duplicateUrls: {
    uniqueUrls: urlMap.size,
    duplicateGroupsCount: duplicateUrlGroups,
    totalEntriesInDuplicates: totalDuplicateUrlEntries
  },
  dimensionAnomalies: dimAnomalies
};

fs.mkdirSync(path.join(__dirname, '../reports'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../reports/dataset-analysis-summary.json'), JSON.stringify(summary, null, 2));

console.log('Analysis summary written!');
console.log('Marketplaces:', mktDist);
console.log('Top 20 Raw Category Pairs:');
const sortedCats = Object.entries(rawCatCounts).sort((a, b) => b[1] - a[1]);
console.log(sortedCats.slice(0, 25));
