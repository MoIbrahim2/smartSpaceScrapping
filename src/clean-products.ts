#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { classifyProduct } from './normalizers/relevanceClassifier.js';
import { normalizePrice } from './normalizers/priceNormalizer.js';
import { extractDimensions } from './normalizers/dimensions.js';
import { sanitizeDimensions } from './normalizers/dimensionsSanitizer.js';
import { normalizeColors } from './normalizers/color.js';
import { normalizeMaterials } from './normalizers/material.js';
import { normalizeStyles } from './normalizers/style.js';
import { enrichProductAI } from './normalizers/aiEnrichment.js';
import { calculateQualityScore } from './normalizers/qualityScorer.js';
import { detectAndProcessDuplicates } from './normalizers/duplicateDetector.js';
import { expandCatalog } from './normalizers/catalogExpander.js';
import { UnifiedProduct } from './types/schema.js';

const program = new Command();

program
  .name('clean-products')
  .description('SmartSpaceAI Product Catalog Filtering & Normalization Pipeline')
  .version('1.0.0')
  .option('--dry-run', 'Analyze and generate reports without overwriting output products catalog files', false)
  .option('-e, --expand', 'Expand catalog to achieve 100% taxonomy category coverage with synthetic variations', false)
  .option('--explain <productId>', 'Explain classification and relevance of a specific product ID')
  .option('-i, --input <path>', 'Input raw catalog JSON file', 'product_catalog.json')
  .option('-o, --output-dir <dir>', 'Directory to save clean catalogs', 'output')
  .option('-r, --reports-dir <dir>', 'Directory to save report files', 'reports');

program.parse(process.argv);
const options = program.opts();

const INPUT_PATH = path.join(process.cwd(), options.input);
const OUTPUT_DIR = path.join(process.cwd(), options.outputDir);
const REPORTS_DIR = path.join(process.cwd(), options.reportsDir);

// Dynamic Room taxonomy from category_rules for coverage report
const ROOMS_LIST = [
  { room: 'living_room', title: 'Living Room', categories: ['Sofa', 'Coffee Table', 'TV Unit', 'Curtains', 'Side Table', 'Rug', 'Floor Lamp', 'Bookshelf', 'Wall Art', 'Armchair'] },
  { room: 'bedroom', title: 'Bedroom', categories: ['Bed', 'Wardrobe', 'Nightstand', 'Dresser', 'Curtains', 'Rug', 'Table Lamp', 'Mirror', 'Bedroom Armchair'] },
  { room: 'kids_room', title: 'Kids Room', categories: ['Kids Bed', 'Kids Wardrobe', 'Study Desk', 'Study Chair', 'Bookshelf', 'Rug', 'Storage Unit', 'Wall Decor', 'Night Light'] },
  { room: 'dining_room', title: 'Dining Room', categories: ['Dining Table', 'Dining Chairs', 'Buffet Sideboard', 'Chandelier', 'Rug', 'Curtains', 'Wall Art'] },
  { room: 'kitchen', title: 'Kitchen', categories: ['Kitchen Cabinet Set', 'Countertop', 'Kitchen Island', 'Storage Rack', 'Bar Stool', 'Kitchen Lighting', 'Wall Shelf'] },
  { room: 'bathroom', title: 'Bathroom', categories: ['Vanity Unit', 'Shower Enclosure', 'Toilet', 'Mirror Cabinet', 'Shelving', 'Towel Rack', 'Accessories Set', 'Bathroom Lighting'] },
  { room: 'office', title: 'Office', categories: ['Office Desk', 'Office Chair', 'Bookshelf', 'Filing Cabinet', 'Desk Lamp', 'Rug', 'Whiteboard'] },
  { room: 'game_room', title: 'Game Room', categories: ['Gaming Desk', 'Gaming Chair', 'TV Unit', 'Sofa', 'Storage Unit', 'LED Lighting', 'Rug', 'Sound System Stand'] },
  { room: 'balcony', title: 'Balcony', categories: ['Outdoor Seating', 'Outdoor Table', 'Planter', 'Outdoor Lighting', 'Outdoor Rug', 'Swing'] }
];

async function runPipeline() {
  const startTime = Date.now();
  console.log(`Starting SmartSpaceAI Cleaning Pipeline...`);
  console.log(`Input Catalog Path: ${INPUT_PATH}`);

  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Error: Raw catalog file does not exist at ${INPUT_PATH}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  console.log(`Successfully loaded ${rawData.length} products from catalog.`);

  if (options.explain) {
    explainProduct(rawData, options.explain);
    return;
  }

  const acceptedList: UnifiedProduct[] = [];
  const reviewList: UnifiedProduct[] = [];
  const rejectedList: any[] = [];

  let count = 0;
  for (const raw of rawData) {
    count++;
    if (count % 500 === 0 || count === rawData.length) {
      console.log(`Processed ${count} / ${rawData.length} products...`);
    }

    const rawName = raw.basic?.name || raw.name || 'Untitled Product';
    const rawCategory = raw.classification?.category || raw.rawCategory || '';
    const rawSub = raw.classification?.subcategory || raw.rawSubcategory || '';
    const rawDesc = raw.basic?.description || raw.description || '';
    const rawSpecs = raw.specifications || {};

    // 1. Relevance and Category Classification
    const classResult = classifyProduct(rawName, rawCategory, rawDesc, rawSpecs);

    // 2. Price Normalization
    const priceResult = normalizePrice(
      raw.pricing?.currentPrice ?? raw.currentPrice,
      raw.pricing?.originalPrice ?? raw.originalPrice
    );

    // 3. Dimensions Sanitization
    const extractedDims = extractDimensions(
      rawSpecs,
      rawName,
      rawDesc,
      classResult.canonicalCategory
    );
    const sanitizedDims = sanitizeDimensions(
      {
        width: raw.dimensions?.width ?? extractedDims.width,
        height: raw.dimensions?.height ?? extractedDims.height,
        depth: raw.dimensions?.depth ?? extractedDims.depth,
        weight: raw.dimensions?.weight ?? extractedDims.weight,
      },
      rawName,
      rawDesc,
      classResult.canonicalCategory
    );

    // 4. Color, Material, Style mapping
    const combinedTextForAttrs = `${rawName} ${rawDesc} ${rawCategory} ${rawSub}`;
    const colors = normalizeColors(combinedTextForAttrs);
    const materials = normalizeMaterials(combinedTextForAttrs);
    const styles = normalizeStyles(combinedTextForAttrs, classResult.canonicalCategory);

    // 5. AI Rich Embedding Text
    const aiData = enrichProductAI(
      rawName,
      rawDesc,
      raw.basic?.brand || raw.brand || 'Generic',
      classResult.canonicalCategory,
      styles,
      colors,
      materials,
      classResult.roomTypes
    );

    const issues = [...sanitizedDims.issues];

    // Format formatted images list
    const formattedImages = (raw.images || []).map((img: any, idx: number) => ({
      url: typeof img === 'string' ? img : img.url,
      isPrimary: typeof img === 'string' ? idx === 0 : (img.isPrimary ?? idx === 0)
    }));
    if (formattedImages.length === 0) {
      formattedImages.push({
        url: 'https://via.placeholder.com/600x600.png?text=SmartSpaceAI+Furniture',
        isPrimary: true
      });
    }

    const intermediateProduct = {
      externalId: raw.externalId || raw.id,
      source: {
        marketplace: raw.source?.marketplace || raw.marketplace || 'Unknown',
        productUrl: raw.source?.productUrl || raw.productUrl || '',
        country: 'Egypt' as const,
        scrapedAt: raw.source?.scrapedAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      basic: {
        name: rawName,
        brand: raw.basic?.brand || raw.brand || 'Generic',
        description: rawDesc,
        sku: raw.basic?.sku || raw.sku || raw.externalId || null
      },
      classification: {
        canonicalCategory: classResult.canonicalCategory,
        roomTypes: classResult.roomTypes,
        styles,
        materials,
        colors,
        tags: [classResult.canonicalCategory, ...styles, ...colors]
      },
      pricing: {
        currency: 'EGP' as const,
        currentPrice: priceResult.currentPrice,
        originalPrice: priceResult.originalPrice,
        discountPercentage: priceResult.discountPercentage
      },
      dimensions: {
        width: sanitizedDims.width,
        height: sanitizedDims.height,
        length: sanitizedDims.length,
        dimensionUnit: 'cm' as const,
        weight: sanitizedDims.weight,
        weightUnit: 'kg' as const
      },
      images: formattedImages,
      availability: {
        inStock: raw.availability?.inStock ?? raw.inStock ?? true,
        stockStatus: raw.availability?.stockStatus ?? raw.stockStatus ?? 'In Stock'
      },
      rating: {
        average: raw.rating?.average ?? raw.ratingAverage ?? 4.0,
        reviews: raw.rating?.reviews ?? raw.ratingReviews ?? 5
      },
      ai: {
        embeddingText: aiData.embeddingText,
        styleLabels: aiData.styleLabels,
        dominantColors: aiData.dominantColors,
        roomCompatibility: aiData.roomCompatibility,
        keywords: aiData.keywords
      }
    };

    // Calculate Quality Score
    const qualityResult = calculateQualityScore(intermediateProduct, classResult.canonicalCategory);
    const finalIssues = Array.from(new Set([...issues, ...qualityResult.issues]));

    const processedProduct: UnifiedProduct = {
      ...intermediateProduct,
      processing: {
        status: classResult.status,
        categoryConfidence: classResult.confidence,
        qualityScore: qualityResult.score,
        issues: finalIssues,
        normalizationVersion: '1.0'
      }
    };

    if (classResult.status === 'ACCEPTED') {
      acceptedList.push(processedProduct);
    } else if (classResult.status === 'REVIEW') {
      reviewList.push(processedProduct);
    } else {
      rejectedList.push({
        externalId: processedProduct.externalId,
        name: rawName,
        marketplace: processedProduct.source.marketplace,
        rawCategory: `${rawCategory} > ${rawSub}`,
        reasons: classResult.reasons
      });
    }
  }

  // Deduplication
  const { mergedProducts: dedupedProducts, duplicateCandidatesReport } = detectAndProcessDuplicates(acceptedList);
  
  let cleanProducts = dedupedProducts;
  if (options.expand) {
    cleanProducts = expandCatalog(cleanProducts, 25);
  }

  const durationMs = Date.now() - startTime;
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  const speed = Math.round((rawData.length / (durationMs / 1000)));

  // Count category metrics for reports
  const categoryCounts: Record<string, number> = {};
  cleanProducts.forEach(p => {
    const cat = p.classification.canonicalCategory;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Category coverage & Room taxonomy compile
  const roomCoverageReport: Record<string, Record<string, number>> = {};
  const missingCategoriesList: string[] = [];
  const lowCoverageCategoriesList: { category: string; count: number }[] = [];

  ROOMS_LIST.forEach(roomInfo => {
    roomCoverageReport[roomInfo.title] = {};
    roomInfo.categories.forEach(cat => {
      const cnt = categoryCounts[cat] || 0;
      roomCoverageReport[roomInfo.title][cat] = cnt;
      if (cnt === 0) {
        if (!missingCategoriesList.includes(cat)) missingCategoriesList.push(cat);
      } else if (cnt < 5) {
        if (!lowCoverageCategoriesList.some(item => item.category === cat)) {
          lowCoverageCategoriesList.push({ category: cat, count: cnt });
        }
      }
    });
  });

  // Create outputs directories if not existing
  if (!options.dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Generate Reports & Saving Outputs
  if (!options.dryRun) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'products_clean_3d.json'), JSON.stringify(cleanProducts, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'products_review.json'), JSON.stringify(reviewList, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'products_rejected.json'), JSON.stringify(rejectedList, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'duplicate_candidates.json'), JSON.stringify(duplicateCandidatesReport, null, 2));
  }

  // Generate mapping reports
  const mappingReportJson = {
    totalRawScraped: rawData.length,
    acceptedAfterDedup: cleanProducts.length,
    reviewPending: reviewList.length,
    rejected: rejectedList.length,
    duplicatesIdentified: acceptedList.length - cleanProducts.length,
    categoryCounts,
    roomCoverage: roomCoverageReport
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'category-mapping-report.json'), JSON.stringify(mappingReportJson, null, 2));
  generateCategoryMappingMarkdownReport(mappingReportJson, missingCategoriesList, lowCoverageCategoriesList);

  const cleaningReportJson = {
    pipelineExecution: {
      executionTimeMs: durationMs,
      peakMemoryMb: Math.round(memoryUsage * 100) / 100,
      throughputProductsPerSecond: speed
    },
    qualityScoringSummary: {
      excellent: cleanProducts.filter(p => p.processing.qualityScore >= 80).length,
      good: cleanProducts.filter(p => p.processing.qualityScore >= 60 && p.processing.qualityScore < 80).length,
      incomplete: cleanProducts.filter(p => p.processing.qualityScore >= 40 && p.processing.qualityScore < 60).length,
      poor: cleanProducts.filter(p => p.processing.qualityScore < 40).length
    },
    issuesSummary: compileIssuesSummary(cleanProducts, reviewList)
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'cleaning-report.json'), JSON.stringify(cleaningReportJson, null, 2));
  generateCleaningMarkdownReport(cleaningReportJson);

  // Printing CLI output summary
  console.log(`\n======================================================`);
  console.log(`PIPELINE EXECUTION SUMMARY`);
  console.log(`======================================================`);
  console.log(`Execution Time: ${durationMs} ms`);
  console.log(`Throughput:     ${speed} products/sec`);
  console.log(`Peak Memory:    ${Math.round(memoryUsage * 100) / 100} MB`);
  console.log(`\nINPUT AND CLASSIFICATION COUNTS:`);
  console.log(`Total Scraped Raw:  ${rawData.length}`);
  console.log(`Confidently Accepted: ${acceptedList.length}`);
  console.log(`After Deduplication:  ${cleanProducts.length}`);
  console.log(`Review Pending:       ${reviewList.length}`);
  console.log(`Rejected (Filtered):  ${rejectedList.length}`);
  console.log(`Duplicates Auto-Merged: ${acceptedList.length - cleanProducts.length}`);
  console.log(`======================================================\n`);
}

function compileIssuesSummary(cleanList: UnifiedProduct[], reviewList: UnifiedProduct[]) {
  const issuesMap: Record<string, number> = {};
  cleanList.forEach(p => {
    p.processing.issues.forEach(issue => {
      issuesMap[issue] = (issuesMap[issue] || 0) + 1;
    });
  });
  reviewList.forEach(p => {
    p.processing.issues.forEach(issue => {
      issuesMap[issue] = (issuesMap[issue] || 0) + 1;
    });
  });
  return issuesMap;
}

function generateCategoryMappingMarkdownReport(data: any, missing: string[], lowCoverage: any[]) {
  let md = `# SmartSpaceAI Category Mapping Report

## 1. Cleaned Inventory Statistics

- **Total Inputs:** ${data.totalRawScraped}
- **Accepted Products:** ${data.acceptedAfterDedup}
- **Needs Manual Review:** ${data.reviewPending}
- **Rejected/Filtered Out:** ${data.rejected}
- **Merged Duplicates:** ${data.duplicatesIdentified}

---

## 2. Category Counts by SmartSpaceAI Room Type

`;

  ROOMS_LIST.forEach(roomInfo => {
    md += `### ${roomInfo.title}\n\n| Canonical Category | Count |\n| :--- | :--- |\n`;
    roomInfo.categories.forEach(cat => {
      md += `| **${cat}** | ${data.categoryCounts[cat] || 0} |\n`;
    });
    md += `\n`;
  });

  md += `---

## 3. Taxonomy Coverage Alert Gaps

### 🛑 MISSING CATEGORIES (Zero Products Scraped)
${missing.length === 0 ? '*None - All categories have at least 1 product.*' : missing.map(m => `- **${m}**`).join('\n')}

### ⚠️ LOW COVERAGE CATEGORIES (Less than 5 Products)
${lowCoverage.length === 0 ? '*None - All categories have good coverage.*' : lowCoverage.map(item => `- **${item.category}** (${item.count} products)`).join('\n')}
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'category-mapping-report.md'), md);
}

function generateCleaningMarkdownReport(data: any) {
  const md = `# SmartSpaceAI Data Cleaning & Quality Report

## 1. Pipeline Execution Performance Metrics

- **Total Execution Time:** ${data.pipelineExecution.executionTimeMs} ms
- **Throughput Speed:** ${data.pipelineExecution.throughputProductsPerSecond} products/second
- **Peak Process Memory:** ${data.pipelineExecution.peakMemoryMb} MB

---

## 2. Product Quality Scoring Summary

All accepted products are scored from 0 to 100 based on standard design criteria.

- **EXCELLENT (80-100):** ${data.qualityScoringSummary.excellent} products
- **GOOD (60-79):** ${data.qualityScoringSummary.good} products
- **INCOMPLETE (40-59):** ${data.qualityScoringSummary.incomplete} products
- **POOR (0-39):** ${data.qualityScoringSummary.poor} products

---

## 3. Extraction Quality & Schema Sanitization Issues

Summary of warnings flagged during processing:

| Issue Key / Warning Flag | Occurrence Count | Description |
| :--- | :--- | :--- |
${Object.entries(data.issuesSummary).map(([issue, count]) => `| \`${issue}\` | ${count} | Warnings generated during parsing/sanitization |`).join('\n')}
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'cleaning-report.md'), md);
}

function explainProduct(catalog: any[], id: string) {
  const rawProduct = catalog.find(p => p.externalId === id || p.id === id);

  if (!rawProduct) {
    console.log(`Product with ID "${id}" was not found in raw catalog.`);
    return;
  }

  const name = rawProduct.basic?.name || rawProduct.name || 'Untitled';
  const rawCat = rawProduct.classification?.category || rawProduct.rawCategory || '';
  const desc = rawProduct.basic?.description || rawProduct.description || '';
  const specs = rawProduct.specifications || {};

  const classResult = classifyProduct(name, rawCat, desc, specs);
  
  console.log(`\n======================================================`);
  console.log(`EXPLAIN MODE FOR PRODUCT: "${id}"`);
  console.log(`======================================================`);
  console.log(`Name:        ${name}`);
  console.log(`Raw Category: ${rawCat}`);
  console.log(`\nSTATUS:      ${classResult.status}`);
  console.log(`Category:    ${classResult.canonicalCategory}`);
  console.log(`Rooms:       ${classResult.roomTypes.join(', ')}`);
  console.log(`Confidence:  ${classResult.confidence}`);
  console.log(`\nReasoning Log:`);
  classResult.reasons.forEach((r, idx) => console.log(`  ${idx + 1}. ${r}`));
  
  // Re-run dimension normalizer for explanation
  const extractedDims = extractDimensions(specs, name, desc, classResult.canonicalCategory);
  const sanitizedDims = sanitizeDimensions(
    {
      width: rawProduct.dimensions?.width ?? extractedDims.width,
      height: rawProduct.dimensions?.height ?? extractedDims.height,
      depth: rawProduct.dimensions?.depth ?? extractedDims.depth,
      weight: rawProduct.dimensions?.weight ?? extractedDims.weight,
    },
    name,
    desc,
    classResult.canonicalCategory
  );

  console.log(`\nSanitized Dimensions:`);
  console.log(`  Width:  ${sanitizedDims.width} cm`);
  console.log(`  Length: ${sanitizedDims.length} cm`);
  console.log(`  Height: ${sanitizedDims.height} cm`);
  console.log(`  Weight: ${sanitizedDims.weight} kg`);
  if (sanitizedDims.issues.length > 0) {
    console.log(`  Dimension Flags: ${sanitizedDims.issues.join(', ')}`);
  }

  console.log(`======================================================\n`);
}

runPipeline().catch(err => {
  console.error(`Pipeline failure: ${err.message}`);
  process.exit(1);
});
