const fs = require('fs');
const path = require('path');

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../product_catalog.json'), 'utf8'));
const sampleBed = catalog.find(p => p.externalId === 'B0H6GPPQC7');
console.log(JSON.stringify(sampleBed, null, 2));
