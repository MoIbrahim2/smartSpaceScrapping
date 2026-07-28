const fs = require('fs');
const path = require('path');

const analysisData = JSON.parse(fs.readFileSync(path.join(__dirname, '../reports/dataset-analysis.json'), 'utf8'));
const catalogPath = path.join(__dirname, '../product_catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Format samples of prices, dimensions, colors, materials
const samplePrices = products.map(p => p.pricing).filter(Boolean).slice(0, 5);
const sampleDims = products.map(p => p.dimensions).filter(Boolean).slice(0, 5);
const sampleColors = products.map(p => p.classification?.colors).filter(c => c && c.length > 0).slice(0, 5);
const sampleMaterials = products.map(p => p.classification?.material).filter(m => m && m.length > 0).slice(0, 5);

let mdContent = `# SmartSpaceAI Product Catalog Dataset Analysis Report

**Generated Date:** ${new Date().toISOString()}  
**Source Dataset:** \`product_catalog.json\`  
**Dataset Root Format:** JSON Array  

---

## 1. Executive Summary

- **Total Scraped Products:** 3,961
- **Marketplaces Analyzed:**
  - **Noon Egypt:** 3,837 products (96.87%)
  - **Amazon Egypt:** 124 products (3.13%)
- **Data Integrity & Completeness:**
  - **Prices Present:** 100% (3,961 / 3,961)
  - **Dimensions Present:** 100% (3,961 / 3,961) — *Note: Dimension accuracy & semantics vary and require cleaning.*
  - **Primary Images Present:** 100% (3,961 / 3,961)
  - **Descriptions Present:** ~88.4% (3,502 / 3,961)
  - **Brand Missing / Generic:** ~85.2% (3,375 / 3,961)
  - **Duplicate Product URLs:** 1,349 duplicate entries across shared listing pages

---

## 2. Marketplace & Category Distribution

### Marketplace Breakdown
| Marketplace | Product Count | Percentage |
| :--- | :--- | :--- |
| **Noon Egypt** | 3,837 | 96.87% |
| **Amazon Egypt** | 124 | 3.13% |
| **Jumia Egypt** | 0 (Not in catalog file) | 0.00% |
| **IKEA Egypt** | 0 (Not in catalog file) | 0.00% |

### Marketplace Category & Subcategory Frequencies
| Marketplace Category Pair | Product Count | Sample Titles |
| :--- | :--- | :--- |
| \`Storage Unit > Storage\` | 3,359 | Wooden storage cabinet, facial tissues, stand fan, air fryer, detergent |
| \`Bed > Beds\` | 200 | Wooden Captonia Bed, Velvet Bed Frame, Storage Bed |
| \`Toilet > Bathroom Fixtures\` | 95 | Wall-mounted Toilet, Ceramic Toilet Set |
| \`Rug > Rugs\` | 40 | Modern Area Rug, Bohemian Floor Carpet |
| \`Mirror > Decor\` | 35 | Decorative Wall Mirror, Full-length Mirror |
| \`Sofa > Seating\` | 27 | 3-Seater Sofa, L-Shape Sectional Couch |
| \`Office Desk > Desks\` | 23 | Executive Wooden Desk, Computer Table |
| \`Curtains > Window Treatments\` | 22 | Blackout Curtains, Sheer Window Drapery |
| \`Dining Table > Dining Tables\` | 19 | 6-Seater Wooden Dining Table, Glass Top Dining Table |
| \`Table Lamp > Lighting\` | 15 | Bedside Table Lamp, Ceramic Lamp |
| \`Bookshelf > Storage\` | 14 | 5-Tier Bookshelf, Display Shelves |
| \`LED Lighting > Lighting\` | 14 | RGB LED Strip Light, Ambient LED Light |
| \`Chandelier > Lighting\` | 14 | Modern Crystal Chandelier, Pendant Light |
| \`Wardrobe > Storage\` | 11 | 3-Door Sliding Wardrobe, Armoire |
| \`Side Table > Tables\` | 10 | Wooden Side Table, End Table |
| \`Storage Rack > Kitchen Storage\` | 10 | Spice Rack, Kitchen Metal Storage Rack |
| \`Wall Art > Decor\` | 10 | Canvas Paintings, Framed Wall Decor |

---

## 3. Schema & Data Attribute Inspection

### Schema Structure
Raw products follow a unified wrapper schema with top-level keys:
- \`externalId\`
- \`source\` (\`marketplace\`, \`country\`, \`productUrl\`, \`scrapedAt\`, \`lastUpdated\`)
- \`basic\` (\`name\`, \`brand\`, \`description\`, \`sku\`)
- \`classification\` (\`category\`, \`subcategory\`, \`roomTypes\`, \`style\`, \`material\`, \`colors\`, \`tags\`)
- \`pricing\` (\`currency\`, \`currentPrice\`, \`originalPrice\`, \`discountPercentage\`)
- \`dimensions\` (\`width\`, \`height\`, \`depth\`, \`weight\`, \`unit\`)
- \`images\` (Array of \`{ url, isPrimary }\`)
- \`availability\` (\`inStock\`, \`stockStatus\`, \`deliveryAvailable\`)
- \`rating\` (\`average\`, \`reviews\`)
- \`ai\` (\`embeddingText\`, \`styleLabels\`, \`dominantColors\`, \`roomCompatibility\`, \`keywords\`)

### Data Format Inspection
1. **Price Formats:**
   - \`currency\`: "EGP"
   - Numbers clean float/int (e.g. \`5490\`, \`12999\`)
2. **Dimension Formats:**
   - Unit: \`"cm"\`, \`"mm"\`, \`"m"\`
   - Numeric fields: \`width\`, \`height\`, \`depth\`, \`weight\`
   - *Anomalies discovered:* Some beds have \`width: 600\` or \`depth: 200\` due to raw scraper packaging unit confusion. Needs dimension cleaning.
3. **Color Formats:**
   - Mixed English/Arabic strings (e.g., \`"Natural Wood"\`, \`"أبيض"\`, \`"Multicolor"\`, \`"Black"\`)
4. **Material Formats:**
   - Mixed English/Arabic strings (e.g., \`"Wood"\`, \`"خشب زان"\`, \`"MDF"\`, \`"Fabric"\`, \`"Leather"\`)

---

## 4. Proposed Marketplace to SmartSpaceAI Category Mappings

| Marketplace Category | Proposed SmartSpaceAI Canonical Category | Target Room Types | Products | Confidence |
| :--- | :--- | :--- | :--- | :--- |
| \`Bed > Beds\` | **Bed** | Bedroom | 200 | HIGH |
| \`Kids Bed > Beds\` | **Kids Bed** | Kids Room | 3 | HIGH |
| \`Sofa > Seating\` | **Sofa** | Living Room, Game Room | 27 | HIGH |
| \`Office Desk > Desks\` | **Office Desk** | Office | 23 | HIGH |
| \`Dining Table > Dining Tables\` | **Dining Table** | Dining Room | 19 | HIGH |
| \`Bookshelf > Storage\` | **Bookshelf** | Living Room, Kids Room, Office | 14 | HIGH |
| \`Wardrobe > Storage\` | **Wardrobe** | Bedroom | 11 | HIGH |
| \`Side Table > Tables\` | **Side Table** | Living Room | 10 | HIGH |
| \`TV Unit > Media Furniture\` | **TV Unit** | Living Room, Game Room | 4 | HIGH |
| \`Kitchen Cabinet Set > Kitchen Cabinets\` | **Kitchen Cabinet Set** | Kitchen | 4 | HIGH |
| \`Countertop > Kitchen Surfaces\` | **Countertop** | Kitchen | 5 | HIGH |
| \`Storage Rack > Kitchen Storage\` | **Storage Rack** | Kitchen | 10 | HIGH |
| \`Toilet > Bathroom Fixtures\` | **Toilet** | Bathroom | 95 | HIGH |
| \`Shelving > Bathroom Storage\` | **Shelving** | Bathroom | 2 | HIGH |
| \`Accessories Set > Bathroom Accessories\` | **Accessories Set** | Bathroom | 4 | HIGH |
| \`Rug > Rugs\` | **Rug** | Living Room, Bedroom, Kids Room, Dining Room, Office, Game Room | 40 | HIGH |
| \`Curtains > Window Treatments\` | **Curtains** | Living Room, Bedroom, Dining Room | 22 | HIGH |
| \`Mirror > Decor\` | **Mirror** | Bedroom | 35 | HIGH |
| \`Wall Art > Decor\` | **Wall Art** | Living Room, Dining Room | 10 | HIGH |
| \`Table Lamp > Lighting\` | **Table Lamp** | Bedroom | 15 | HIGH |
| \`Chandelier > Lighting\` | **Chandelier** | Dining Room | 14 | HIGH |
| \`LED Lighting > Lighting\` | **LED Lighting** | Game Room | 14 | HIGH |
| \`Night Light > Lighting\` | **Night Light** | Kids Room | 6 | HIGH |
| \`Swing > Outdoor Seating\` | **Swing** | Balcony | 4 | HIGH |
| \`Storage Unit > Storage\` | **Storage Unit / REJECTED (Split)** | Various Rooms | 3,359 | MEDIUM |

---

## 5. Critical Finding: The Storage Unit Category Anomaly

**3,359 out of 3,961 products (84.8%) are under \`Storage Unit > Storage\` in Noon Egypt scraping output.**
Inspection reveals that this raw category contains a mixture of:
1. **Valid Interior Storage Furniture (~5-10%):** Wooden storage cabinets, credenzas, sideboards, chests of drawers, shoe cabinets, shelving units.
2. **Irrelevant Consumer Goods & Electronics (~90-95%):** Air fryers, stand fans, facial tissues, dishwashing liquids, washing machines, mops, coffee makers, loofahs, mosquito repellents, electric irons.

**Pipeline Resolution Strategy:**
Deterministic product-title & keyword classification will split this category, routing valid storage furniture to canonical categories (\`Storage Unit\`, \`Buffet Sideboard\`, \`Nightstand\`, \`Filing Cabinet\`, \`Shelving\`) while rejecting consumer non-furniture items deterministically.

---

## 6. SmartSpaceAI Category Coverage & Gaps

### Categories with Good Coverage
- **Bed:** 200 products
- **Toilet:** 95 products
- **Rug:** 40 products
- **Mirror:** 35 products
- **Sofa:** 27 products
- **Office Desk:** 23 products
- **Curtains:** 22 products
- **Dining Table:** 19 products

### Low Coverage / Missing Categories (Requiring Further Scraping)
- **Coffee Table:** 0 products
- **Armchair / Bedroom Armchair:** 0 products
- **Floor Lamp / Desk Lamp / Outdoor Lighting / Kitchen Lighting / Bathroom Lighting:** 0 products
- **Office Chair / Gaming Chair / Study Chair / Dining Chairs / Bar Stool:** 0 products
- **Dresser / Nightstand:** 0 products
- **Gaming Desk / Study Desk:** 0 products
- **Kitchen Island:** 0 products
- **Outdoor Seating / Outdoor Table / Planter / Outdoor Rug:** 0 products
- **Vanity Unit / Shower Enclosure / Towel Rack / Mirror Cabinet:** 0 products

---

## 7. Proposed Rejection Rules

Products must be REJECTED if they match any of the following deterministic criteria:
1. **Product Type Rejection:**
   - Consumer Electronics & Appliances (TVs, laptops, fans, air fryers, washing machines, coffee makers, electric irons, heaters, blenders).
   - Household Consumables & Paper Products (facial tissues, detergents, trash bags, dishwashing liquids, repellents).
   - Personal Care & Accessories (loofahs, scrubs, shampoos, aprons, toothbrushes).
   - Kitchenware & Utensils sold separately (pots, pans, cutlery, plates, mugs, plastic food containers).
   - Replacement Parts & Small Hardware (replacement wheels, cushion covers sold separately, screws, curtain rods, curtain hooks).
2. **Non-Furniture Accessories:**
   - Bed sheets, pillow cases, blankets (unless part of decorative bedding context matching a specific canonical category).
`;

fs.writeFileSync(path.join(__dirname, '../reports/dataset-analysis.md'), mdContent);
console.log('dataset-analysis.md successfully generated!');
