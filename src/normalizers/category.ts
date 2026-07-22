export interface CategoryMapping {
  category: string;
  subcategory: string;
  defaultRoom: string;
}

/**
 * Strict category taxonomy derived directly from /category_rules/*.json:
 * - living_room.json (Sofa, Coffee Table, TV Unit, Curtains, Side Table, Rug, Floor Lamp, Bookshelf, Wall Art, Armchair)
 * - bedroom.json (Bed, Wardrobe, Nightstand, Dresser, Curtains, Rug, Table Lamp, Mirror, Bedroom Armchair)
 * - balcony.json (Outdoor Seating, Outdoor Table, Planter, Outdoor Lighting, Outdoor Rug, Swing)
 * - bathroom.json (Vanity Unit, Shower Enclosure, Toilet, Mirror Cabinet, Shelving, Towel Rack, Accessories Set, Bathroom Lighting)
 * - dining_room.json (Dining Table, Dining Chairs, Buffet Sideboard, Chandelier, Rug, Curtains, Wall Art)
 * - game_room.json (Gaming Desk, Gaming Chair, TV Unit, Sofa, Storage Unit, LED Lighting, Rug, Sound System Stand)
 * - kids_room.json (Kids Bed, Kids Wardrobe, Study Desk, Study Chair, Bookshelf, Rug, Storage Unit, Wall Decor, Night Light)
 * - kitchen.json (Kitchen Cabinet Set, Countertop, Kitchen Island, Storage Rack, Bar Stool, Kitchen Lighting, Wall Shelf)
 * - office.json (Office Desk, Office Chair, Bookshelf, Filing Cabinet, Desk Lamp, Rug, Whiteboard)
 */
const CATEGORY_MAP: Array<{
  keywords: string[];
  mapping: CategoryMapping;
}> = [
  // Specific Chair Types (Evaluated first to prevent 'desk' overlap on 'office chair')
  {
    keywords: ['gaming chair', 'racing chair', 'كرسي جيمنج', 'كرسي ألعاب'],
    mapping: { category: 'Gaming Chair', subcategory: 'Gaming Seating', defaultRoom: 'Game Room' },
  },
  {
    keywords: ['study chair', 'kids chair', 'كرسي مذاكرة', 'كرسي دراسة'],
    mapping: { category: 'Study Chair', subcategory: 'Kids Seating', defaultRoom: 'Kids Room' },
  },
  {
    keywords: ['office chair', 'desk chair', 'executive chair', 'كرسي مكتب', 'كرسي عمل'],
    mapping: { category: 'Office Chair', subcategory: 'Office Seating', defaultRoom: 'Office' },
  },
  {
    keywords: ['dining chair', 'kitchen chair', 'كرسي سفرة', 'كرسي طعام'],
    mapping: { category: 'Dining Chairs', subcategory: 'Dining Seating', defaultRoom: 'Dining Room' },
  },
  {
    keywords: ['bar stool', 'counter stool', 'كرسي بار', 'كرسي كاونتر'],
    mapping: { category: 'Bar Stool', subcategory: 'Bar & Counter Seating', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['outdoor seating', 'outdoor chair', 'patio chair', 'rattan chair', 'كرسي حدائق', 'كرسي راتان', 'طقم حدائق'],
    mapping: { category: 'Outdoor Seating', subcategory: 'Outdoor Seating', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['bedroom armchair', 'bedroom chair', 'reading chair', 'كرسي غرفة نوم'],
    mapping: { category: 'Bedroom Armchair', subcategory: 'Bedroom Seating', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['armchair', 'accent chair', 'فوتيه', 'كرسي انتريه', 'كرسي استرخاء'],
    mapping: { category: 'Armchair', subcategory: 'Seating', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['sofa', 'couch', 'loveseat', 'recliner', 'كنبة', 'كspace', 'انتريه', 'صالون', 'اريكة', 'أريكة'],
    mapping: { category: 'Sofa', subcategory: 'Seating', defaultRoom: 'Living Room' },
  },

  // Tables & Desks
  {
    keywords: ['coffee table', 'center table', 'ترابيزة قهوة', 'طاولة قهوة', 'طاولة وسط', 'ترابيزة انترية'],
    mapping: { category: 'Coffee Table', subcategory: 'Tables', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['side table', 'end table', 'accent table', 'طاولة جانبية', 'ترابيزة جانبية'],
    mapping: { category: 'Side Table', subcategory: 'Tables', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['dining table', 'kitchen table', 'ترابيزة سفرة', 'طاولة طعام', 'سفرة'],
    mapping: { category: 'Dining Table', subcategory: 'Dining Tables', defaultRoom: 'Dining Room' },
  },
  {
    keywords: ['outdoor table', 'patio table', 'balcony table', 'طاولة حدائق', 'طاولة راتان'],
    mapping: { category: 'Outdoor Table', subcategory: 'Outdoor Tables', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['gaming desk', 'طاولة جيمنج', 'مكتب جيمنج'],
    mapping: { category: 'Gaming Desk', subcategory: 'Desks', defaultRoom: 'Game Room' },
  },
  {
    keywords: ['study desk', 'kids desk', 'مكتب مذاكرة', 'مكتب اطفال'],
    mapping: { category: 'Study Desk', subcategory: 'Desks', defaultRoom: 'Kids Room' },
  },
  {
    keywords: ['desk', 'writing desk', 'office desk', 'computer desk', 'مكتب', 'طاولة مكتب', 'مكتب عمل'],
    mapping: { category: 'Office Desk', subcategory: 'Desks', defaultRoom: 'Office' },
  },

  // Beds & Bedroom Furniture
  {
    keywords: ['kids bed', 'bunk bed', 'سرير اطفال', 'سرير دورين'],
    mapping: { category: 'Kids Bed', subcategory: 'Beds', defaultRoom: 'Kids Room' },
  },
  {
    keywords: ['bed', 'headboard', 'bed frame', 'سرير', 'سرير نوم', 'ظهر سرير'],
    mapping: { category: 'Bed', subcategory: 'Beds', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['kids wardrobe', 'دولاب اطفال'],
    mapping: { category: 'Kids Wardrobe', subcategory: 'Storage', defaultRoom: 'Kids Room' },
  },
  {
    keywords: ['wardrobe', 'closet', 'armoire', 'دولاب', 'خزانة ملابس'],
    mapping: { category: 'Wardrobe', subcategory: 'Storage', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['nightstand', 'bedside table', 'bedside', 'كومودينو', 'كومود', 'طاولة سرير'],
    mapping: { category: 'Nightstand', subcategory: 'Bedroom Tables', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['dresser', 'vanity dresser', 'chest of drawers', 'تسريحة', 'شفونيرة', 'وحدة ادراج'],
    mapping: { category: 'Dresser', subcategory: 'Storage', defaultRoom: 'Bedroom' },
  },

  // Media & Storage
  {
    keywords: ['tv unit', 'tv stand', 'tv cabinet', 'media console', 'طاولة تلفزيون', 'وحدة تلفزيون', 'طاولة شاشة'],
    mapping: { category: 'TV Unit', subcategory: 'Media Furniture', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['buffet', 'sideboard', 'credenza', 'بوفيه', 'نيش'],
    mapping: { category: 'Buffet Sideboard', subcategory: 'Dining Storage', defaultRoom: 'Dining Room' },
  },
  {
    keywords: ['bookshelf', 'bookcase', 'مكتبة', 'مكتبة كتب', 'خزانة كتب'],
    mapping: { category: 'Bookshelf', subcategory: 'Storage', defaultRoom: 'Office' },
  },
  {
    keywords: ['filing cabinet', 'خزانة ملفات', 'وحدة أدراج مكتب'],
    mapping: { category: 'Filing Cabinet', subcategory: 'Office Storage', defaultRoom: 'Office' },
  },
  {
    keywords: ['storage rack', 'kitchen rack', 'منظم مطبخ', 'صفاية'],
    mapping: { category: 'Storage Rack', subcategory: 'Kitchen Storage', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['storage unit', 'storage cabinet', 'وحدة تخزين', 'منظم'],
    mapping: { category: 'Storage Unit', subcategory: 'Storage', defaultRoom: 'Living Room' },
  },

  // Kitchen & Bathroom Specialty
  {
    keywords: ['kitchen cabinet', 'kitchen set', 'مطابخ', 'وحدة مطبخ', 'دولاب مطبخ'],
    mapping: { category: 'Kitchen Cabinet Set', subcategory: 'Kitchen Cabinets', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['countertop', 'kitchen top', 'رخامة مطبخ', 'قرصة مطبخ'],
    mapping: { category: 'Countertop', subcategory: 'Kitchen Surfaces', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['kitchen island', 'جزيرة مطبخ'],
    mapping: { category: 'Kitchen Island', subcategory: 'Kitchen Islands', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['vanity unit', 'bathroom vanity', 'sink cabinet', 'وحدة حوض', 'كابينة حوض', 'حوض حمام'],
    mapping: { category: 'Vanity Unit', subcategory: 'Bathroom Fixtures', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['shower enclosure', 'shower door', 'shower cabin', 'كبينة شاور', 'كابينة دش'],
    mapping: { category: 'Shower Enclosure', subcategory: 'Bathroom Fixtures', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['toilet', 'water closet', 'wc', 'قاعدة حمام', 'تواليت', 'كومبينيشن'],
    mapping: { category: 'Toilet', subcategory: 'Bathroom Fixtures', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['mirror cabinet', 'خزانة مراية', 'مراية حمام'],
    mapping: { category: 'Mirror Cabinet', subcategory: 'Bathroom Storage', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['shelving', 'bathroom shelf', 'ارفف حمام', 'رفوف حمام'],
    mapping: { category: 'Shelving', subcategory: 'Bathroom Storage', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['towel rack', 'towel rail', 'towel bar', 'فواطة', 'حامل فوط'],
    mapping: { category: 'Towel Rack', subcategory: 'Bathroom Accessories', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['accessories set', 'bathroom accessories', 'soap dispenser', 'طقم حمام', 'صبانة'],
    mapping: { category: 'Accessories Set', subcategory: 'Bathroom Accessories', defaultRoom: 'Bathroom' },
  },

  // Soft Furnishings & Window Treatments
  {
    keywords: ['curtain', 'drapes', 'drape', 'blind', 'ستارة', 'ستائر'],
    mapping: { category: 'Curtains', subcategory: 'Window Treatments', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['outdoor rug', 'patio rug', 'سجاد حدائق'],
    mapping: { category: 'Outdoor Rug', subcategory: 'Rugs', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['rug', 'carpet', 'runner rug', 'سجادة', 'سجاد', 'مشاية'],
    mapping: { category: 'Rug', subcategory: 'Rugs', defaultRoom: 'Living Room' },
  },

  // Lighting
  {
    keywords: ['floor lamp', 'مصباح أرضي', 'اباجورة ارضية'],
    mapping: { category: 'Floor Lamp', subcategory: 'Lighting', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['table lamp', 'bedside lamp', 'مصباح طاولة'],
    mapping: { category: 'Table Lamp', subcategory: 'Lighting', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['desk lamp', 'study lamp', 'أباجورة مكتب', 'مصباح مكتب'],
    mapping: { category: 'Desk Lamp', subcategory: 'Lighting', defaultRoom: 'Office' },
  },
  {
    keywords: ['outdoor lighting', 'string light', 'solar light', 'إضاءة حدائق', 'حبل اضاءة'],
    mapping: { category: 'Outdoor Lighting', subcategory: 'Lighting', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['bathroom lighting', 'bathroom light', 'إضاءة حمام'],
    mapping: { category: 'Bathroom Lighting', subcategory: 'Lighting', defaultRoom: 'Bathroom' },
  },
  {
    keywords: ['kitchen lighting', 'kitchen light', 'إضاءة مطبخ'],
    mapping: { category: 'Kitchen Lighting', subcategory: 'Lighting', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['led lighting', 'led strip', 'rgb light', 'شريط ليد'],
    mapping: { category: 'LED Lighting', subcategory: 'Lighting', defaultRoom: 'Game Room' },
  },
  {
    keywords: ['chandelier', 'نجفة', 'ثريا'],
    mapping: { category: 'Chandelier', subcategory: 'Lighting', defaultRoom: 'Dining Room' },
  },
  {
    keywords: ['night light', 'سهارية', 'مصباح ليلي'],
    mapping: { category: 'Night Light', subcategory: 'Lighting', defaultRoom: 'Kids Room' },
  },

  // Decor, Balcony & Accessories
  {
    keywords: ['wall art', 'painting', 'canvas', 'poster', 'لوحة', 'تابلوه', 'لوحات جدارية'],
    mapping: { category: 'Wall Art', subcategory: 'Decor', defaultRoom: 'Living Room' },
  },
  {
    keywords: ['wall decor', 'ديكور حائط'],
    mapping: { category: 'Wall Decor', subcategory: 'Decor', defaultRoom: 'Kids Room' },
  },
  {
    keywords: ['mirror', 'full length mirror', 'wall mirror', 'مرآة', 'مراية'],
    mapping: { category: 'Mirror', subcategory: 'Decor', defaultRoom: 'Bedroom' },
  },
  {
    keywords: ['planter', 'flower pot', 'plant pot', 'اصيص زرع', 'نبات'],
    mapping: { category: 'Planter', subcategory: 'Botanical Decor', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['swing', 'egg chair', 'hanging chair', 'مرجيحة', 'أرجوحة'],
    mapping: { category: 'Swing', subcategory: 'Outdoor Seating', defaultRoom: 'Balcony' },
  },
  {
    keywords: ['sound system stand', 'speaker stand', 'حامل سماعات'],
    mapping: { category: 'Sound System Stand', subcategory: 'Audio Accessories', defaultRoom: 'Game Room' },
  },
  {
    keywords: ['wall shelf', 'kitchen shelf', 'رف جداري'],
    mapping: { category: 'Wall Shelf', subcategory: 'Shelving', defaultRoom: 'Kitchen' },
  },
  {
    keywords: ['whiteboard', 'marker board', 'سبورة', 'سبورة بيضاء'],
    mapping: { category: 'Whiteboard', subcategory: 'Office Accessories', defaultRoom: 'Office' },
  },
];

const EXCLUDED_KEYWORDS = [
  'phone', 'mobile', 'laptop', 'shirt', 'dress', 'shoes', 'pants', 't-shirt', 'shampoo',
  'perfume', 'makeup', 'groceries', 'snack', 'jewel',
  'waffle', 'sandwich', 'fryer', 'blender', 'mixer', 'scrub',
  'glove', 'vacuum', 'cooker', 'microwave', 'refrigerator',
  'fridge', 'toaster', 'juicer', 'processor',
  'موبايل', 'هاتف', 'قميص', 'فستان', 'حذاء', 'عطر', 'لعبة', 'طعام', 'ساعة يد', 'خلاط',
  'قلاية', 'صابون', 'منظف', 'ميكروويف', 'موقد', 'ثلاجة'
];

/**
 * Category seed names that indicate the page is already a furniture/home listing.
 * When a product comes from one of these categories, we trust the source and
 * accept it as long as it doesn't match an exclusion keyword.
 */
const TRUSTED_CATEGORY_KEYWORDS = [
  'furniture', 'decor', 'lighting', 'bedding', 'bedroom', 'living room',
  'dining', 'office', 'outdoor', 'patio', 'garden', 'balcony', 'storage',
  'lamp', 'rug', 'curtain', 'mirror', 'shelf', 'shelving', 'art',
  'أثاث', 'ديكور', 'اضاءة', 'مفروشات', 'غرف', 'مكتب',
];

/** Broad keywords that indicate a product is home/furniture-related */
const BROAD_FURNITURE_KEYWORDS = [
  // English broad terms
  'table', 'chair', 'shelf', 'rack', 'cabinet', 'drawer', 'mattress',
  'topper', 'pillow', 'cushion', 'blanket', 'comforter', 'duvet',
  'lamp', 'light', 'clock', 'frame', 'vase', 'candle', 'organizer',
  'hanger', 'hook', 'basket', 'bin', 'box', 'stand', 'bench',
  'stool', 'ottoman', 'pouf', 'bean bag', 'cover', 'protector',
  'shade', 'valance', 'rod', 'holder', 'dispenser', 'tray',
  'mat', 'pad', 'sheet', 'set', 'decor', 'decoration', 'ornament',
  'figurine', 'sculpture', 'photo frame', 'picture', 'tapestry',
  'hammock', 'parasol', 'umbrella', 'gazebo', 'pergola',
  'fan', 'heater', 'humidifier',
  // Arabic broad terms
  'طاولة', 'كرسي', 'رف', 'خزانة', 'درج', 'مرتبة', 'مخدة', 'بطانية',
  'لحاف', 'مصباح', 'اضاءة', 'ساعة', 'برواز', 'مزهرية', 'شمعة',
  'علاقة', 'سلة', 'صندوق', 'حامل', 'مقعد', 'سجادة', 'غطاء',
  'ستارة', 'مراية', 'لوحة', 'تابلوه', 'أباجورة', 'نجفة',
  'كنبة', 'سرير', 'دولاب', 'مكتب', 'سفرة', 'تسريحة', 'كومودينو',
  'فوتيه', 'بوفيه', 'نيش', 'وحدة', 'ركنة', 'انتريه', 'راتان',
  'خشب', 'قطيفة', 'جلد', 'قماش',
];

export function isFurnishingProduct(name: string, rawCategory: string = ''): boolean {
  const combined = `${name} ${rawCategory}`.toLowerCase();

  // Hard exclusions – definitely not furniture
  for (const ex of EXCLUDED_KEYWORDS) {
    if (combined.includes(ex)) {
      return false;
    }
  }

  // If the product comes from a trusted furniture category page, accept it
  if (rawCategory) {
    const catLower = rawCategory.toLowerCase();
    for (const trusted of TRUSTED_CATEGORY_KEYWORDS) {
      if (catLower.includes(trusted)) {
        return true;
      }
    }
  }

  // Check against the strict category map
  for (const item of CATEGORY_MAP) {
    for (const kw of item.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return true;
      }
    }
  }

  // Check against broad furniture keywords
  for (const bkw of BROAD_FURNITURE_KEYWORDS) {
    if (combined.includes(bkw.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export function normalizeCategory(rawName: string, rawCategory: string = ''): CategoryMapping {
  const text = `${rawName} ${rawCategory}`.toLowerCase();

  for (const item of CATEGORY_MAP) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return item.mapping;
      }
    }
  }

  // Strict fallback matching rules
  return {
    category: 'Storage Unit',
    subcategory: 'Storage',
    defaultRoom: 'Living Room',
  };
}
