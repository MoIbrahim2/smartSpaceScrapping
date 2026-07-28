const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../product_catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const storageProducts = products.filter(p => p.classification?.category === 'Storage Unit');

console.log(`Total Storage Unit products: ${storageProducts.length}`);

// Sample 50 product names from Storage Unit
console.log('\n--- SAMPLE 50 STORAGE UNIT PRODUCT NAMES ---');
storageProducts.slice(0, 50).forEach((p, i) => {
  console.log(`${i+1}. [${p.source?.marketplace}] ${p.basic?.name}`);
});

// Keyword analysis in Storage Unit names
const keywords = {};
storageProducts.forEach(p => {
  const name = (p.basic?.name || '').toLowerCase();
  const words = name.split(/\s+/);
  words.forEach(w => {
    if (w.length > 3) keywords[w] = (keywords[w] || 0) + 1;
  });
});

console.log('\n--- TOP KEYWORDS IN STORAGE UNIT NAMES ---');
const sortedKeywords = Object.entries(keywords).sort((a, b) => b[1] - a[1]);
console.log(sortedKeywords.slice(0, 40));
