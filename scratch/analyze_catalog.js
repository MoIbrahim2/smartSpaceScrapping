import fs from 'fs';
import path from 'path';

function analyzeCatalog() {
  const filePath = path.resolve('full_catalog.json');
  if (!fs.existsSync(filePath)) {
    console.log('full_catalog.json not found!');
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const catalog = JSON.parse(raw);

  console.log(`=== Total Products: ${catalog.length} ===\n`);

  // Marketplace breakdown
  const marketplaceCounts = {};
  const categoryCounts = {};
  const roomCounts = {};
  let withDimsCount = 0;
  let inStockCount = 0;

  for (const item of catalog) {
    // Marketplace
    const mp = item.source?.marketplace || 'Unknown';
    marketplaceCounts[mp] = (marketplaceCounts[mp] || 0) + 1;

    // Category
    const cat = item.classification?.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Room
    const rooms = item.classification?.roomTypes || [];
    for (const r of rooms) {
      roomCounts[r] = (roomCounts[r] || 0) + 1;
    }

    // Dimensions
    const d = item.dimensions;
    if (d && d.width !== null && d.height !== null && d.depth !== null) {
      withDimsCount++;
    }

    if (item.availability?.inStock) {
      inStockCount++;
    }
  }

  console.log('--- Marketplace Breakdown ---');
  console.table(marketplaceCounts);

  console.log('--- Top 15 Categories ---');
  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  console.table(sortedCats.slice(0, 15));

  console.log('--- Room Compatibility Breakdown ---');
  console.table(roomCounts);

  console.log('--- Quality & Completeness ---');
  console.log(`Products with complete dimensions (width/height/depth): ${withDimsCount} / ${catalog.length} (${Math.round((withDimsCount / catalog.length) * 100)}%)`);
  console.log(`In Stock Products: ${inStockCount} / ${catalog.length}`);
}

analyzeCatalog();
