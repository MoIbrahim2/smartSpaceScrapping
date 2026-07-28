const fs = require('fs');

const products = JSON.parse(fs.readFileSync('output/products_clean_3d.json', 'utf8'));

console.log('Total products:', products.length);

const issuesSet = new Set();
const dimensionIssuesSet = new Set();
const categoriesCount = {};

products.forEach(p => {
  const cat = p.classification?.canonicalCategory || 'Unknown';
  categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;

  if (p.processing && Array.isArray(p.processing.issues)) {
    p.processing.issues.forEach(iss => {
      issuesSet.add(iss);
      if (iss.toLowerCase().includes('dimension') || iss.toLowerCase().includes('height') || iss.toLowerCase().includes('width') || iss.toLowerCase().includes('length') || iss.toLowerCase().includes('depth') || iss.toLowerCase().includes('size') || iss.toLowerCase().includes('bounds') || iss.toLowerCase().includes('imputed')) {
        dimensionIssuesSet.add(iss);
      }
    });
  }
});

console.log('All unique issues:', Array.from(issuesSet));
console.log('Dimension-related issues:', Array.from(dimensionIssuesSet));
console.log('Categories count:', categoriesCount);
