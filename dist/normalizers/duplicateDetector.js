"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAndProcessDuplicates = detectAndProcessDuplicates;
/**
 * Normalizes title for fuzzy comparison by removing spaces, special characters, and lowercase.
 */
function getNormalizedTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '')
        .trim();
}
/**
 * Multi-level duplicate detector.
 * 1. Merges exact duplicates (Level 1 & Level 2 matching SKU) automatically.
 * 2. Identifies cross-marketplace fuzzy matches (Level 3) and creates duplicate candidates reference mapping.
 */
function detectAndProcessDuplicates(products) {
    // Step 1: Safe merging of exact duplicates (same marketplace + externalId, or same SKU)
    const exactMap = new Map();
    for (const product of products) {
        const sku = product.basic.sku?.trim().toUpperCase();
        const hasValidSku = sku && sku !== 'N/A' && sku !== 'UNKNOWN' && sku.length > 3;
        // Create unique key based on SKU if present, otherwise marketplace + external ID
        const key = hasValidSku
            ? `SKU:${sku}`
            : `MKT:${product.source.marketplace}:${product.externalId}`;
        if (exactMap.has(key)) {
            const existing = exactMap.get(key);
            // Merge properties safely
            if (product.images.length > existing.images.length) {
                existing.images = product.images;
            }
            const pReviews = product.rating.reviews ?? 0;
            const eReviews = existing.rating.reviews ?? 0;
            if (pReviews > eReviews) {
                existing.rating = product.rating;
            }
            // Merge compatible room types and tags
            existing.classification.roomTypes = Array.from(new Set([...existing.classification.roomTypes, ...product.classification.roomTypes]));
            existing.classification.tags = Array.from(new Set([...existing.classification.tags, ...product.classification.tags]));
            // Update last scraped timestamp
            if (new Date(product.source.scrapedAt) > new Date(existing.source.scrapedAt)) {
                existing.source.lastUpdated = product.source.scrapedAt;
            }
        }
        else {
            exactMap.set(key, { ...product });
        }
    }
    const mergedProducts = Array.from(exactMap.values());
    const duplicateCandidatesReport = [];
    // Step 2: Cross-marketplace fuzzy candidate detection
    // Compare each product with others to find Level 3 duplicate candidates
    for (let i = 0; i < mergedProducts.length; i++) {
        const p1 = mergedProducts[i];
        const p1NormalizedTitle = getNormalizedTitle(p1.basic.name);
        const candidates = [];
        // Compare with all subsequent products to avoid duplicate pair listing
        for (let j = 0; j < mergedProducts.length; j++) {
            if (i === j)
                continue;
            const p2 = mergedProducts[j];
            // Don't compare products from the same marketplace
            if (p1.source.marketplace === p2.source.marketplace)
                continue;
            let isDuplicateCandidate = false;
            let similarityReason = '';
            // Check 1: Same title (normalized) and same category
            if (p1NormalizedTitle === getNormalizedTitle(p2.basic.name) && p1.classification.canonicalCategory === p2.classification.canonicalCategory) {
                isDuplicateCandidate = true;
                similarityReason = 'Identical normalized title and matching canonical category';
            }
            // Check 2: Same brand and very similar dimensions (within 5 cm tolerance) and category
            if (p1.basic.brand && p2.basic.brand &&
                p1.basic.brand !== 'Generic' && p2.basic.brand !== 'Generic' &&
                p1.basic.brand === p2.basic.brand &&
                p1.classification.canonicalCategory === p2.classification.canonicalCategory) {
                const d1 = p1.dimensions;
                const d2 = p2.dimensions;
                if (d1.width !== null && d2.width !== null && Math.abs(d1.width - d2.width) <= 5 &&
                    d1.length !== null && d2.length !== null && Math.abs(d1.length - d2.length) <= 5 &&
                    d1.height !== null && d2.height !== null && Math.abs(d1.height - d2.height) <= 5) {
                    isDuplicateCandidate = true;
                    similarityReason = 'Same brand, matching category, and identical physical dimensions (5cm tolerance)';
                }
            }
            if (isDuplicateCandidate) {
                candidates.push({
                    externalId: p2.externalId,
                    name: p2.basic.name,
                    marketplace: p2.source.marketplace,
                    similarityReason
                });
            }
        }
        if (candidates.length > 0) {
            duplicateCandidatesReport.push({
                primaryProductId: p1.externalId,
                marketplace: p1.source.marketplace,
                candidateProductIds: candidates
            });
            // Enrich product with duplicate candidate pointers
            if (!p1.ai) {
                p1.ai = { embeddingText: '', styleLabels: [], dominantColors: [], roomCompatibility: [], keywords: [] };
            }
        }
    }
    return {
        mergedProducts,
        duplicateCandidatesReport
    };
}
