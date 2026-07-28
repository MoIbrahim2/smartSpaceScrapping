const fs = require('fs');
const path = require('path');

const clean3dPath = path.join(__dirname, '../output/products_clean_3d.json');
const products = JSON.parse(fs.readFileSync(clean3dPath, 'utf8'));

console.log(`Analyzing ${products.length} products in output/products_clean_3d.json...`);

let nullWidth = 0;
let nullHeight = 0;
let nullLength = 0;
let fullyComplete = 0;

products.forEach((p, idx) => {
  const d = p.dimensions || {};
  const hasW = d.width !== null && d.width > 0;
  const hasH = d.height !== null && d.height > 0;
  const hasL = d.length !== null && d.length > 0;

  if (!hasW) nullWidth++;
  if (!hasH) nullHeight++;
  if (!hasL) nullLength++;

  if (hasW && hasH && hasL) {
    fullyComplete++;
  }
});

console.log(`Total Products: ${products.length}`);
console.log(`100% Fully Complete 3D Products: ${fullyComplete} (${Math.round(fullyComplete/products.length*100)}%)`);
console.log(`Null Widths: ${nullWidth}`);
console.log(`Null Heights: ${nullHeight}`);
console.log(`Null Lengths: ${nullLength}`);
