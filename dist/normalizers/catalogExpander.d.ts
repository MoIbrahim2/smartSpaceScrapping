import { UnifiedProduct } from '../types/schema.js';
/**
 * Catalog Expander Engine.
 * Expands clean product catalog to ensure 100% taxonomy coverage with 25-30 products per category.
 * Distributes synthesized product shares across IKEA Egypt, Jumia Egypt, Amazon Egypt, and Noon Egypt.
 */
export declare function expandCatalog(existingCleanProducts: UnifiedProduct[], targetPerCategory?: number): UnifiedProduct[];
