const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../output/products_clean_3d.json');
const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const SELLER_MAP = {
  "Amazon Egypt": "6a65618b557e76bb4102a095",
  "IKEA Egypt": "6a65618b557e76bb4102a096",
  "Noon Egypt": "6a65618b557e76bb4102a097",
  "Jumia Egypt": "6a65618b557e76bb4102a098"
};

console.log(`Adding seller_id references to ${products.length} products...`);

let countAmazon = 0;
let countIkea = 0;
let countNoon = 0;
let countJumia = 0;

const updatedProducts = products.map(p => {
  const mkt = p.source?.marketplace;
  const sellerId = SELLER_MAP[mkt] || "6a65618b557e76bb4102a095";

  if (mkt === "Amazon Egypt") countAmazon++;
  else if (mkt === "IKEA Egypt") countIkea++;
  else if (mkt === "Noon Egypt") countNoon++;
  else if (mkt === "Jumia Egypt") countJumia++;

  return {
    ...p,
    sellerId: sellerId,
    source: {
      ...p.source,
      sellerId: sellerId
    }
  };
});

fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2));

console.log(`Successfully updated ${updatedProducts.length} products in output/products_clean_3d.json!`);
console.log(`Breakdown by Seller ObjectId:`);
console.log(`  Amazon Egypt (6a65618b557e76bb4102a095): ${countAmazon}`);
console.log(`  IKEA Egypt   (6a65618b557e76bb4102a096): ${countIkea}`);
console.log(`  Noon Egypt   (6a65618b557e76bb4102a097): ${countNoon}`);
console.log(`  Jumia Egypt  (6a65618b557e76bb4102a098): ${countJumia}`);
