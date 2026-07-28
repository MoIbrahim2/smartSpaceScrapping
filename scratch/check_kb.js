const fs = require('fs');
const path = require('path');

const kbDir = path.join(__dirname, '../knowledge_base');
const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.json'));

const canonicalTaxonomy = {};

files.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(kbDir, file), 'utf8'));
  const roomName = file.replace('.json', '');
  const roomTypeTitle = content.roomType || roomName;
  const categories = content.rules ? content.rules.map(r => r.category) : [];
  canonicalTaxonomy[roomName] = {
    roomType: roomTypeTitle,
    categories: categories
  };
});

console.log(JSON.stringify(canonicalTaxonomy, null, 2));
