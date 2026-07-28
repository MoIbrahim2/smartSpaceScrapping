const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../output/products_dummy_5k.json');
const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('=== DATASET VERIFICATION REPORT ===');
console.log('Target File:', filePath);
console.log('Total Products:', products.length);

let nullDimensions = 0;
let dimensionIssuesCount = 0;
const categoriesCount = {};
const roomTypesCount = {};
const stylesSet = new Set();
const materialsSet = new Set();
const colorsSet = new Set();

const isDimensionIssue = (issue) => {
  const lower = issue.toLowerCase();
  return (
    lower.includes('dimension') ||
    lower.includes('imputed') ||
    lower.includes('out_of_bounds') ||
    lower.includes('swapped_width') ||
    lower.includes('swapped_height') ||
    lower.includes('swapped_length') ||
    lower.includes('package_dimensions') ||
    lower.includes('ambiguous_dimensions')
  );
};

products.forEach((p) => {
  // Check dimensions completeness
  const dims = p.dimensions || {};
  if (dims.width == null || dims.height == null || dims.length == null) {
    nullDimensions++;
  }

  // Check issues
  if (p.processing && Array.isArray(p.processing.issues)) {
    p.processing.issues.forEach((iss) => {
      if (isDimensionIssue(iss)) {
        dimensionIssuesCount++;
      }
    });
  }

  // Classifications
  const cat = p.classification?.canonicalCategory || 'Unknown';
  categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;

  if (Array.isArray(p.classification?.roomTypes)) {
    p.classification.roomTypes.forEach((r) => {
      roomTypesCount[r] = (roomTypesCount[r] || 0) + 1;
    });
  }

  if (Array.isArray(p.classification?.styles)) {
    p.classification.styles.forEach((s) => stylesSet.add(s));
  }

  if (Array.isArray(p.classification?.materials)) {
    p.classification.materials.forEach((m) => materialsSet.add(m));
  }

  if (Array.isArray(p.classification?.colors)) {
    p.classification.colors.forEach((c) => colorsSet.add(c));
  }
});

console.log('\n--- METRICS SUMMARY ---');
console.log('Null 3D Spatial Dimensions Count:', nullDimensions);
console.log('Remaining Dimension Issues in processing.issues:', dimensionIssuesCount);
console.log('Unique Canonical Categories Count:', Object.keys(categoriesCount).length);
console.log('Unique Room Types Covered:', Object.keys(roomTypesCount).length);
console.log('Unique Design Styles Covered:', stylesSet.size);
console.log('Unique Materials Covered:', materialsSet.size);
console.log('Unique Color Palettes Covered:', colorsSet.size);

console.log('\n--- CATEGORY DISTRIBUTION SAMPLE (Top 15 & Bottom 5) ---');
const sortedCategories = Object.entries(categoriesCount).sort((a, b) => b[1] - a[1]);
console.log('Top 15 Categories:', sortedCategories.slice(0, 15));
console.log('Bottom 5 Categories:', sortedCategories.slice(-5));
