const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../output/products_clean_3d.json');
const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Starting DB Readiness Audit on ${products.length} products...`);

let issues = [];
const idSet = new Set();
const skuMap = {};

let nullPrices = 0;
let nullWidths = 0;
let nullHeights = 0;
let nullLengths = 0;
let missingImages = 0;
let missingEmbeddingText = 0;
let emptyNames = 0;
let invalidMarketplaces = 0;

const VALID_MARKETPLACES = new Set(['Amazon Egypt', 'Noon Egypt', 'IKEA Egypt', 'Jumia Egypt']);

products.forEach((p, idx) => {
  const pId = p.externalId || `index-${idx}`;

  // 1. Unique ID check
  if (!p.externalId) {
    issues.push(`Product at index ${idx} missing externalId`);
  } else if (idSet.has(p.externalId)) {
    issues.push(`Duplicate externalId found: ${p.externalId}`);
  } else {
    idSet.add(p.externalId);
  }

  // 2. Name check
  if (!p.basic?.name || p.basic.name.trim() === '') {
    emptyNames++;
    issues.push(`Product ${pId} has empty basic.name`);
  }

  // 3. Pricing check
  if (p.pricing?.currentPrice === null || p.pricing?.currentPrice === undefined || p.pricing?.currentPrice <= 0) {
    nullPrices++;
    issues.push(`Product ${pId} has invalid currentPrice`);
  }

  // 4. Dimensions check
  const d = p.dimensions || {};
  if (d.width === null || d.width === undefined || d.width <= 0) nullWidths++;
  if (d.height === null || d.height === undefined || d.height <= 0) nullHeights++;
  if (d.length === null || d.length === undefined || d.length <= 0) nullLengths++;

  // 5. Images check
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    missingImages++;
    issues.push(`Product ${pId} has no images`);
  } else {
    const hasPrimary = p.images.some(img => img.isPrimary && img.url);
    if (!hasPrimary) {
      issues.push(`Product ${pId} missing primary image flag`);
    }
  }

  // 6. AI Embedding Text check
  if (!p.ai?.embeddingText || p.ai.embeddingText.trim() === '') {
    missingEmbeddingText++;
    issues.push(`Product ${pId} missing ai.embeddingText`);
  }

  // 7. Marketplace check
  if (!VALID_MARKETPLACES.has(p.source?.marketplace)) {
    invalidMarketplaces++;
    issues.push(`Product ${pId} has unexpected marketplace: ${p.source?.marketplace}`);
  }
});

const report = {
  totalProducts: products.length,
  uniqueExternalIds: idSet.size,
  auditResults: {
    duplicateExternalIds: products.length - idSet.size,
    emptyNames,
    invalidPrices: nullPrices,
    nullWidths,
    nullHeights,
    nullLengths,
    missingImages,
    missingEmbeddingText,
    invalidMarketplaces,
    totalCriticalErrors: issues.length
  },
  dbReadinessStatus: issues.length === 0 ? "PASSED (100% DB Ready)" : "WARNINGS FOUND",
  sampleProduct: products[0]
};

console.log("\n=========================================");
console.log("DB READINESS AUDIT RESULTS");
console.log("=========================================");
console.log(`Total Products: ${report.totalProducts}`);
console.log(`Unique External IDs: ${report.uniqueExternalIds}`);
console.log(`Duplicate IDs: ${report.auditResults.duplicateExternalIds}`);
console.log(`Empty Product Names: ${report.auditResults.emptyNames}`);
console.log(`Invalid Prices: ${report.auditResults.invalidPrices}`);
console.log(`Null Widths: ${report.auditResults.nullWidths}`);
console.log(`Null Heights: ${report.auditResults.nullHeights}`);
console.log(`Null Lengths: ${report.auditResults.nullLengths}`);
console.log(`Missing Images: ${report.auditResults.missingImages}`);
console.log(`Missing AI Embedding Texts: ${report.auditResults.missingEmbeddingText}`);
console.log(`Invalid Marketplaces: ${report.auditResults.invalidMarketplaces}`);
console.log(`STATUS: ${report.dbReadinessStatus}`);
console.log("=========================================\n");

fs.writeFileSync(path.join(__dirname, '../reports/db-readiness-audit.json'), JSON.stringify(report, null, 2));
