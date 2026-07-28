import { ExtractedDimensions } from './dimensions.js';

export interface SanitizedDimensions {
  width: number;
  height: number;
  length: number;
  weight: number;
  unit: 'cm';
  issues: string[];
}

// Realistic fallback defaults (width, length, height) in cm by category
const REALISTIC_CATEGORY_DEFAULTS: Record<string, { width: number; length: number; height: number }> = {
  "Bed": { width: 160, length: 200, height: 110 },
  "Kids Bed": { width: 120, length: 195, height: 90 },
  "Sofa": { width: 200, length: 85, height: 85 },
  "Armchair": { width: 85, length: 85, height: 85 },
  "Bedroom Armchair": { width: 80, length: 80, height: 85 },
  "Coffee Table": { width: 110, length: 60, height: 45 },
  "Side Table": { width: 50, length: 45, height: 55 },
  "Dining Table": { width: 160, length: 90, height: 75 },
  "Office Desk": { width: 120, length: 60, height: 75 },
  "Gaming Desk": { width: 140, length: 70, height: 75 },
  "Study Desk": { width: 110, length: 55, height: 75 },
  "Dining Chairs": { width: 48, length: 50, height: 90 },
  "Bar Stool": { width: 42, length: 42, height: 75 },
  "Office Chair": { width: 65, length: 65, height: 115 },
  "Gaming Chair": { width: 70, length: 70, height: 125 },
  "Study Chair": { width: 48, length: 50, height: 85 },
  "Wardrobe": { width: 160, length: 55, height: 200 },
  "Kids Wardrobe": { width: 120, length: 50, height: 180 },
  "Nightstand": { width: 50, length: 45, height: 55 },
  "Dresser": { width: 120, length: 45, height: 85 },
  "TV Unit": { width: 160, length: 40, height: 50 },
  "Buffet Sideboard": { width: 160, length: 45, height: 85 },
  "Bookshelf": { width: 80, length: 35, height: 180 },
  "Shelving": { width: 80, length: 35, height: 150 },
  "Storage Unit": { width: 90, length: 40, height: 120 },
  "Storage Rack": { width: 60, length: 35, height: 140 },
  "Wall Shelf": { width: 60, length: 20, height: 30 },
  "Toilet": { width: 38, length: 68, height: 78 },
  "Countertop": { width: 120, length: 60, height: 4 },
  "Kitchen Island": { width: 150, length: 80, height: 90 },
  "Kitchen Cabinet Set": { width: 240, length: 60, height: 210 },
  "Vanity Unit": { width: 90, length: 50, height: 85 },
  "Shower Enclosure": { width: 90, length: 90, height: 200 },
  "Mirror Cabinet": { width: 65, length: 18, height: 70 },
  "Towel Rack": { width: 60, length: 15, height: 20 },
  "Accessories Set": { width: 30, length: 20, height: 15 },
  "Mirror": { width: 60, length: 5, height: 80 },
  "Curtains": { width: 140, length: 5, height: 260 },
  "Rug": { width: 160, length: 230, height: 1 },
  "Chandelier": { width: 55, length: 55, height: 60 },
  "Floor Lamp": { width: 40, length: 40, height: 160 },
  "Table Lamp": { width: 30, length: 30, height: 50 },
  "Desk Lamp": { width: 25, length: 25, height: 45 },
  "LED Lighting": { width: 100, length: 5, height: 5 },
  "Kitchen Lighting": { width: 40, length: 40, height: 30 },
  "Bathroom Lighting": { width: 40, length: 15, height: 15 },
  "Outdoor Lighting": { width: 25, length: 25, height: 40 },
  "Night Light": { width: 15, length: 15, height: 20 },
  "Wall Art": { width: 80, length: 4, height: 60 },
  "Wall Decor": { width: 60, length: 4, height: 60 },
  "Whiteboard": { width: 120, length: 3, height: 90 },
  "Filing Cabinet": { width: 45, length: 50, height: 100 },
  "Sound System Stand": { width: 35, length: 35, height: 80 },
  "Outdoor Seating": { width: 130, length: 75, height: 80 },
  "Outdoor Table": { width: 90, length: 80, height: 70 },
  "Planter": { width: 35, length: 35, height: 45 },
  "Outdoor Rug": { width: 160, length: 230, height: 1 },
  "Swing": { width: 110, length: 100, height: 195 }
};

// Typical realistic bounds for product dimensions in cm by category
const REALISTIC_BOUNDS: Record<string, {
  width: [number, number];
  length: [number, number];
  height: [number, number];
}> = {
  "Bed": { width: [80, 240], length: [150, 240], height: [30, 160] },
  "Kids Bed": { width: [70, 150], length: [130, 210], height: [30, 120] },
  "Sofa": { width: [100, 380], length: [60, 150], height: [40, 120] },
  "Armchair": { width: [50, 120], length: [50, 120], height: [50, 120] },
  "Bedroom Armchair": { width: [50, 110], length: [50, 110], height: [50, 120] },
  "Coffee Table": { width: [40, 200], length: [30, 120], height: [25, 75] },
  "Side Table": { width: [30, 90], length: [30, 90], height: [30, 85] },
  "Dining Table": { width: [80, 300], length: [60, 150], height: [70, 85] },
  "Office Desk": { width: [70, 240], length: [40, 120], height: [70, 90] },
  "Gaming Desk": { width: [80, 240], length: [50, 120], height: [70, 90] },
  "Study Desk": { width: [70, 180], length: [40, 90], height: [70, 90] },
  "Dining Chairs": { width: [35, 80], length: [35, 80], height: [70, 120] },
  "Bar Stool": { width: [30, 70], length: [30, 70], height: [50, 110] },
  "Office Chair": { width: [45, 90], length: [45, 90], height: [80, 150] },
  "Gaming Chair": { width: [50, 90], length: [50, 90], height: [100, 160] },
  "Study Chair": { width: [40, 80], length: [40, 80], height: [70, 120] },
  "Wardrobe": { width: [50, 350], length: [35, 90], height: [140, 260] },
  "Kids Wardrobe": { width: [50, 200], length: [35, 80], height: [120, 220] },
  "Nightstand": { width: [30, 90], length: [25, 70], height: [30, 85] },
  "Dresser": { width: [60, 240], length: [35, 75], height: [60, 150] },
  "TV Unit": { width: [80, 320], length: [25, 70], height: [30, 120] },
  "Buffet Sideboard": { width: [80, 260], length: [35, 75], height: [60, 120] },
  "Bookshelf": { width: [40, 240], length: [20, 60], height: [80, 240] },
  "Shelving": { width: [30, 180], length: [10, 60], height: [30, 220] },
  "Storage Unit": { width: [40, 240], length: [25, 80], height: [40, 220] }
};

/**
 * Sanitizes extracted 3D spatial dimensions (width, height, length in cm).
 * Automatically imputes realistic category defaults for any null fields.
 */
export function sanitizeDimensions(
  rawDims: { width: number | null; height: number | null; depth?: number | null; length?: number | null; weight: number | null },
  title: string,
  description: string,
  category: string
): SanitizedDimensions {
  let width = rawDims.width;
  let height = rawDims.height;
  let length = rawDims.length ?? rawDims.depth ?? null;
  let weight = rawDims.weight;
  const issues: string[] = [];

  const combined = `${title} ${description}`.toLowerCase();

  // Look for packages vs product keyword indicator
  const hasPackageKeyword = /\b(package|shipping|box|package dimensions|ابعاد الشحنة|الكرتونة)\b/i.test(combined);
  if (hasPackageKeyword) {
    issues.push("package_dimensions_detected");
  }

  // Helper to check regex matches in title for clean 2D dimensions
  const parseTitleDimensions = (): { w: number; l: number } | null => {
    const match = title.match(/(\d{2,3})\s*(?:cm|سم)?\s*[*x×]\s*(\d{2,3})\s*(?:cm|سم)/i) ||
                  title.match(/(\d{2,3})\s*[*x×]\s*(\d{2,3})/i);
    if (match) {
      const w = parseInt(match[1], 10);
      const l = parseInt(match[2], 10);
      if (w > 20 && l > 20) {
        return { w, l };
      }
    }
    return null;
  };

  const bounds = REALISTIC_BOUNDS[category];
  
  if (bounds) {
    // Check if the current dimensions are completely out of realistic bounds
    const isWidthUnrealistic = width !== null && (width < bounds.width[0] || width > bounds.width[1]);
    const isLengthUnrealistic = length !== null && (length < bounds.length[0] || length > bounds.length[1]);
    const isHeightUnrealistic = height !== null && (height < bounds.height[0] || height > bounds.height[1]);

    if (isWidthUnrealistic || isLengthUnrealistic) {
      // Try to re-parse from title
      const titleDims = parseTitleDimensions();
      if (titleDims) {
        if (category === 'Bed' || category === 'Kids Bed') {
          width = Math.min(titleDims.w, titleDims.l);
          length = Math.max(titleDims.w, titleDims.l);
        } else {
          width = titleDims.w;
          length = titleDims.l;
        }
        issues.push("reparsed_from_title");
      } else {
        // Swapping heuristics
        if (width !== null && length !== null) {
          const swappedWidth = length;
          const swappedLength = width;
          const swappedWValid = swappedWidth >= bounds.width[0] && swappedWidth <= bounds.width[1];
          const swappedLValid = swappedLength >= bounds.length[0] && swappedLength <= bounds.length[1];

          if (swappedWValid && swappedLValid) {
            width = swappedWidth;
            length = swappedLength;
            issues.push("swapped_width_length");
          } else {
            issues.push("ambiguous_dimensions");
          }
        } else {
          issues.push("ambiguous_dimensions");
        }
      }
    }
    
    // Check height limits
    if (height !== null && isHeightUnrealistic) {
      if (length !== null) {
        const swappedHeight = length;
        const swappedLength = height;
        const swappedHValid = swappedHeight >= bounds.height[0] && swappedHeight <= bounds.height[1];
        const swappedLValid = swappedLength >= bounds.length[0] && swappedLength <= bounds.length[1];

        if (swappedHValid && swappedLValid) {
          height = swappedHeight;
          length = swappedLength;
          issues.push("swapped_height_length");
        } else {
          issues.push("height_out_of_bounds");
        }
      } else {
        issues.push("height_out_of_bounds");
      }
    }
  }

  // Check limits against realistic bounds
  if (bounds) {
    if (width !== null && (width < bounds.width[0] || width > bounds.width[1])) {
      width = null;
    }
    if (length !== null && (length < bounds.length[0] || length > bounds.length[1])) {
      length = null;
    }
    if (height !== null && (height < bounds.height[0] || height > bounds.height[1])) {
      height = null;
    }
  }

  // Impute realistic category defaults for any null field
  const defaults = REALISTIC_CATEGORY_DEFAULTS[category] || { width: 100, length: 60, height: 75 };
  let imputed = false;

  if (width === null || width <= 0) {
    width = defaults.width;
    imputed = true;
  }
  if (length === null || length <= 0) {
    length = defaults.length;
    imputed = true;
  }
  if (height === null || height <= 0) {
    height = defaults.height;
    imputed = true;
  }

  if (imputed) {
    issues.push("dimensions_imputed_realistic");
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    length: Math.round(length),
    weight: weight !== null ? Math.round(weight * 10) / 10 : 25,
    unit: 'cm',
    issues
  };
}
