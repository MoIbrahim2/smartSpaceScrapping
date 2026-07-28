const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../output/products_clean_3d.json');
console.log('Reading:', filePath);

const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

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

let removedIssuesCount = 0;
let totalProducts = products.length;

products.forEach((p) => {
  if (p.processing && Array.isArray(p.processing.issues)) {
    const originalLength = p.processing.issues.length;
    p.processing.issues = p.processing.issues.filter((iss) => !isDimensionIssue(iss));
    removedIssuesCount += originalLength - p.processing.issues.length;
  }
});

fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf8');

console.log(`Successfully cleaned ${filePath}`);
console.log(`Total Products: ${totalProducts}`);
console.log(`Removed ${removedIssuesCount} dimension-related issues.`);

// Quick verification
const remainingIssues = new Set();
products.forEach((p) => {
  if (p.processing && Array.isArray(p.processing.issues)) {
    p.processing.issues.forEach((iss) => remainingIssues.add(iss));
  }
});

console.log('Remaining issues in products_clean_3d.json:', Array.from(remainingIssues));
