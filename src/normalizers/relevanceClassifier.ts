import fs from 'fs';
import path from 'path';

// Load configurations dynamically using process.cwd() to remain compatible with both ESM and CJS
const aliasesPath = path.join(process.cwd(), 'config/category-aliases.json');
const rulesPath = path.join(process.cwd(), 'config/rejection-rules.json');

const CATEGORY_ALIASES = JSON.parse(fs.readFileSync(aliasesPath, 'utf8'));
const REJECTION_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

// Strict Room Mappings derived from canonical taxonomy rules
const CATEGORY_TO_ROOMS: Record<string, string[]> = {
  "Air Conditioner": ["bedroom", "dining_room", "game_room", "kids_room", "living_room", "office"],
  "TV": ["bedroom", "living_room"],
  "Refrigerator": ["kitchen"],
  "Washing Machine": ["bathroom"],
  "Oven / Cooktop": ["kitchen"],
  "Microwave": ["kitchen"],
  "Dishwasher": ["kitchen"],
  "Range Hood": ["kitchen"],
  "Computer Monitor": ["office"],
  "Printer": ["office"],
  "Water Heater": ["bathroom"],
  "Outdoor Fan / Heater": ["balcony"],

  "Sofa": ["living_room", "game_room"],
  "Coffee Table": ["living_room"],
  "TV Unit": ["living_room", "game_room"],
  "Curtains": ["living_room", "bedroom", "dining_room"],
  "Side Table": ["living_room"],
  "Rug": ["living_room", "bedroom", "kids_room", "dining_room", "office", "game_room"],
  "Floor Lamp": ["living_room"],
  "Bookshelf": ["living_room", "kids_room", "office"],
  "Wall Art": ["living_room", "dining_room"],
  "Armchair": ["living_room"],
  "Bed": ["bedroom"],
  "Wardrobe": ["bedroom"],
  "Nightstand": ["bedroom"],
  "Dresser": ["bedroom"],
  "Table Lamp": ["bedroom"],
  "Mirror": ["bedroom"],
  "Bedroom Armchair": ["bedroom"],
  "Kids Bed": ["kids_room"],
  "Kids Wardrobe": ["kids_room"],
  "Study Desk": ["kids_room"],
  "Study Chair": ["kids_room"],
  "Storage Unit": ["kids_room", "game_room"],
  "Wall Decor": ["kids_room"],
  "Night Light": ["kids_room"],
  "Dining Table": ["dining_room"],
  "Dining Chairs": ["dining_room"],
  "Buffet Sideboard": ["dining_room"],
  "Chandelier": ["dining_room"],
  "Kitchen Cabinet Set": ["kitchen"],
  "Countertop": ["kitchen"],
  "Kitchen Island": ["kitchen"],
  "Storage Rack": ["kitchen"],
  "Bar Stool": ["kitchen"],
  "Kitchen Lighting": ["kitchen"],
  "Wall Shelf": ["kitchen"],
  "Vanity Unit": ["bathroom"],
  "Shower Enclosure": ["bathroom"],
  "Toilet": ["bathroom"],
  "Mirror Cabinet": ["bathroom"],
  "Shelving": ["bathroom"],
  "Towel Rack": ["bathroom"],
  "Accessories Set": ["bathroom"],
  "Bathroom Lighting": ["bathroom"],
  "Office Desk": ["office"],
  "Office Chair": ["office"],
  "Filing Cabinet": ["office"],
  "Desk Lamp": ["office"],
  "Whiteboard": ["office"],
  "Gaming Desk": ["game_room"],
  "Gaming Chair": ["game_room"],
  "LED Lighting": ["game_room"],
  "Sound System Stand": ["game_room"],
  "Outdoor Seating": ["balcony"],
  "Outdoor Table": ["balcony"],
  "Planter": ["balcony"],
  "Outdoor Lighting": ["balcony"],
  "Outdoor Rug": ["balcony"],
  "Swing": ["balcony"]
};

// Positive identifiers for valid storage furniture
const VALID_STORAGE_KEYWORDS = [
  "cabinet", "wardrobe", "credenza", "sideboard", "buffet", "dresser", "chest of drawers", "cupboard", "shoe cabinet", "shoe rack",
  "bookcase", "nightstand", "bedside", "storage bench", "drawers storage", "filing cabinet", "locker", "console table",
  "خزانة", "دولاب", "كومودينو", "شيفونيرة", "بوفيه", "مكتبة", "جزامة", "منظم أحذية", "خزانة ملابس", "طاولة كونسول", "تسريحة"
];

export interface ClassificationResult {
  status: 'ACCEPTED' | 'REVIEW' | 'REJECTED';
  canonicalCategory: string;
  roomTypes: string[];
  confidence: number;
  reasons: string[];
}

/**
 * Configuration-driven relevance classifier.
 * Evaluates whether a product is Accepted, Rejected, or needs Review.
 */
export function classifyProduct(
  name: string,
  rawCategory: string = '',
  description: string = '',
  specifications: Record<string, string> = {}
): ClassificationResult {
  const combinedText = `${name} ${rawCategory} ${description} ${Object.values(specifications).join(' ')}`.toLowerCase();
  const reasons: string[] = [];

  // 1. Check Rejection Keywords
  for (const keyword of REJECTION_RULES.excludedKeywords) {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b|${keyword.toLowerCase()}`, 'i');
    if (regex.test(combinedText)) {
      const kLower = keyword.toLowerCase();

      // Specific check to avoid false rejections like "TV Unit" due to "TV"
      if (['tv', 'تلفزيون', 'شاشة'].includes(kLower)) {
        if (/tv unit|tv stand|tv console|وحدة تلفزيون|طاولة تلفزيون|طاولة شاشة/i.test(name.toLowerCase())) {
          continue; // Allow TV Units
        }
      }

      // Allow furniture with phone holder or USB charging port
      if (['هاتف', 'موبايل', 'phone', 'mobile', 'charger', 'charging', 'شاحن'].includes(kLower)) {
        if (/حامل (هاتف|موبايل|جوال)|منفذ شحن|شاحن|phone holder|charging|mobile holder/i.test(combinedText)) {
          continue;
        }
      }

      // Allow furniture descriptions mentioning delivery/assembly service
      if (['service', 'خدمة'].includes(kLower)) {
        if (/توصيل|تركيب|service|guarantee|warranty/i.test(combinedText)) {
          continue;
        }
      }

      reasons.push(`Excluded by keyword matching rule: "${keyword}"`);
      return {
        status: 'REJECTED',
        canonicalCategory: 'REJECTED',
        roomTypes: [],
        confidence: 0.99,
        reasons
      };
    }
  }

  // 2. Perform category mapping using aliases
  let matchedCategory: string | null = null;
  let maxMatchLength = 0;

  for (const [canonical, config] of Object.entries(CATEGORY_ALIASES)) {
    const aliasList = Array.isArray(config) ? config : (config as any).aliases || [];
    for (const alias of aliasList as string[]) {
      // Find matches in name or raw category
      const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b|${alias.toLowerCase()}`, 'i');
      if (aliasRegex.test(name) || aliasRegex.test(rawCategory)) {
        if (alias.length > maxMatchLength) {
          matchedCategory = canonical;
          maxMatchLength = alias.length;
        }
      }
    }
  }

  if (!matchedCategory) {
    reasons.push("Product does not map to any SmartSpaceAI canonical product category.");
    return {
      status: 'REJECTED',
      canonicalCategory: 'REJECTED',
      roomTypes: [],
      confidence: 0.95,
      reasons
    };
  }

  // 3. Apply semantic category rules and disambiguation checks
  let status: 'ACCEPTED' | 'REVIEW' | 'REJECTED' = 'ACCEPTED';
  let confidence = 0.9;
  reasons.push(`Mapped to canonical category "${matchedCategory}" based on keyword match.`);

  // Disambiguation: Storage Unit split rule
  if (matchedCategory === 'Storage Unit') {
    const isFurnitureStorage = VALID_STORAGE_KEYWORDS.some(kw => combinedText.includes(kw.toLowerCase()));
    if (isFurnitureStorage) {
      status = 'ACCEPTED';
      confidence = 0.95;
      reasons.push("Validated as a furniture storage unit based on title/description keywords.");
      
      // Upgrade category if name matches specifically
      if (/dresser|تسريحة/i.test(name)) {
        matchedCategory = 'Dresser';
        reasons.push("Upgraded category to Dresser based on specific title matching.");
      } else if (/wardrobe|دولاب ملابس|خزانة ملابس/i.test(name)) {
        matchedCategory = 'Wardrobe';
        reasons.push("Upgraded category to Wardrobe based on specific title matching.");
      } else if (/nightstand|bedside|كومود/i.test(name)) {
        matchedCategory = 'Nightstand';
        reasons.push("Upgraded category to Nightstand based on specific title matching.");
      } else if (/filing cabinet|خزانة ملفات/i.test(name)) {
        matchedCategory = 'Filing Cabinet';
        reasons.push("Upgraded category to Filing Cabinet based on specific title matching.");
      } else if (/buffet|credenza|sideboard|بوفيه|نيش/i.test(name)) {
        matchedCategory = 'Buffet Sideboard';
        reasons.push("Upgraded category to Buffet Sideboard based on specific title matching.");
      }
    } else {
      // Under Storage Unit but lacks positive furniture indicators
      status = 'REVIEW';
      confidence = 0.6;
      reasons.push("Category mapped to Storage Unit, but lacks positive furniture indicators in product details.");
    }
  }

  // Disambiguation: Lamps/Lighting split rules
  if (matchedCategory === 'Table Lamp' && combinedText.includes('floor')) {
    matchedCategory = 'Floor Lamp';
    reasons.push("Disambiguated to Floor Lamp due to 'floor' keyword.");
  } else if (matchedCategory === 'Table Lamp' && (combinedText.includes('office') || combinedText.includes('desk') || combinedText.includes('مكتب'))) {
    matchedCategory = 'Desk Lamp';
    reasons.push("Disambiguated to Desk Lamp due to 'office/desk/study' keyword context.");
  }

  // Disambiguation: Desks split rules
  if (matchedCategory === 'Office Desk' && combinedText.includes('gaming')) {
    matchedCategory = 'Gaming Desk';
    reasons.push("Disambiguated to Gaming Desk due to 'gaming' keyword context.");
  } else if (matchedCategory === 'Office Desk' && (combinedText.includes('kids') || combinedText.includes('study') || combinedText.includes('دراسة') || combinedText.includes('مذاكرة'))) {
    matchedCategory = 'Study Desk';
    reasons.push("Disambiguated to Study Desk due to 'kids/study' keyword context.");
  }

  // Disambiguation: Chairs split rules
  if (matchedCategory === 'Office Chair' && combinedText.includes('gaming')) {
    matchedCategory = 'Gaming Chair';
    reasons.push("Disambiguated to Gaming Chair due to 'gaming' keyword context.");
  } else if (matchedCategory === 'Office Chair' && (combinedText.includes('study') || combinedText.includes('kids') || combinedText.includes('دراسة') || combinedText.includes('مذاكرة'))) {
    matchedCategory = 'Study Chair';
    reasons.push("Disambiguated to Study Chair due to 'kids/study' keyword context.");
  }

  // Disambiguation: Bed split rules
  if (matchedCategory === 'Bed' && (combinedText.includes('kids') || combinedText.includes('bunk') || combinedText.includes('أطفال') || combinedText.includes('اطفال'))) {
    matchedCategory = 'Kids Bed';
    reasons.push("Disambiguated to Kids Bed due to 'kids/bunk' keyword context.");
  }

  // Disambiguation: Wardrobe split rules
  if (matchedCategory === 'Wardrobe' && (combinedText.includes('kids') || combinedText.includes('أطفال') || combinedText.includes('اطفال'))) {
    matchedCategory = 'Kids Wardrobe';
    reasons.push("Disambiguated to Kids Wardrobe due to 'kids' keyword context.");
  }

  // Retrieve room compatibility types from our source of truth map
  const roomTypes = CATEGORY_TO_ROOMS[matchedCategory] || ["living_room"];

  return {
    status,
    canonicalCategory: matchedCategory,
    roomTypes,
    confidence,
    reasons
  };
}
