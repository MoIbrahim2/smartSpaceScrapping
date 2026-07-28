const fs = require('fs');
const path = require('path');

const cleanPath = path.join(__dirname, '../output/products_clean.json');
const products = JSON.parse(fs.readFileSync(cleanPath, 'utf8'));

console.log(`Loaded ${products.length} clean products.`);

// 1. Marketplace Distribution
const mktDist = {};
products.forEach(p => {
  const m = p.source.marketplace;
  mktDist[m] = (mktDist[m] || 0) + 1;
});

// 2. Quality Score Distribution
const qualityDist = { EXCELLENT: 0, GOOD: 0, INCOMPLETE: 0, POOR: 0 };
products.forEach(p => {
  const score = p.processing.qualityScore;
  if (score >= 80) qualityDist.EXCELLENT++;
  else if (score >= 60) qualityDist.GOOD++;
  else if (score >= 40) qualityDist.INCOMPLETE++;
  else qualityDist.POOR++;
});

// 3. Category & Room Counts
const catDist = {};
const roomDist = {};
products.forEach(p => {
  const cat = p.classification.canonicalCategory;
  catDist[cat] = (catDist[cat] || 0) + 1;

  p.classification.roomTypes.forEach(r => {
    roomDist[r] = (roomDist[r] || 0) + 1;
  });
});

// 4. Pricing Stats
const prices = products.map(p => p.pricing.currentPrice).filter(v => v !== null && v > 0);
prices.sort((a, b) => a - b);
const minPrice = prices[0];
const maxPrice = prices[prices.length - 1];
const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
const medianPrice = prices[Math.floor(prices.length / 2)];

// 5. Dimension Completeness
let fullDims = 0;
let partialDims = 0;
let missingDims = 0;
products.forEach(p => {
  const d = p.dimensions;
  const hasW = d.width !== null;
  const hasH = d.height !== null;
  const hasD = d.depth !== null;
  if (hasW && hasH && hasD) fullDims++;
  else if (hasW || hasH || hasD) partialDims++;
  else missingDims++;
});

// 6. Colors, Materials, Styles
const colorDist = {};
const matDist = {};
const styleDist = {};
products.forEach(p => {
  p.classification.colors.forEach(c => colorDist[c] = (colorDist[c] || 0) + 1);
  p.classification.materials.forEach(m => matDist[m] = (matDist[m] || 0) + 1);
  p.classification.styles.forEach(s => styleDist[s] = (styleDist[s] || 0) + 1);
});

// 7. Processing Issues
const issueCounts = {};
products.forEach(p => {
  p.processing.issues.forEach(i => issueCounts[i] = (issueCounts[i] || 0) + 1);
});

const reportData = {
  totalCleanProducts: products.length,
  marketplaceDistribution: mktDist,
  qualityDistribution: qualityDist,
  pricingStats: { minPrice, maxPrice, avgPrice, medianPrice },
  categoryDistribution: catDist,
  roomDistribution: roomDist,
  dimensionCompleteness: { fullDims, partialDims, missingDims },
  colorDistribution: colorDist,
  materialDistribution: matDist,
  styleDistribution: styleDist,
  issueCounts
};

fs.writeFileSync(path.join(__dirname, '../reports/clean-catalog-analysis.json'), JSON.stringify(reportData, null, 2));
console.log('Clean catalog analysis written!');
