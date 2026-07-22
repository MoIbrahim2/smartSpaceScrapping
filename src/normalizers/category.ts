export interface CategoryMapping {
  category: string;
  subcategory: string;
  defaultRoom: string;
}

const CATEGORY_MAP: Array<{
  keywords: string[];
  mapping: CategoryMapping;
}> = [
  // Sofas / Couches
  {
    keywords: ['sofa', 'couch', 'loveseat', 'recliner', 'كنبة', 'كspace', 'انتريه', 'صالون', 'فوتيه', 'اريكة', 'أريكة'],
    mapping: { category: 'Sofa', subcategory: 'Living Room Seating', defaultRoom: 'Living Room' },
  },
  // Coffee Tables
  {
    keywords: ['coffee table', 'center table', 'ترابيزة قهوة', 'طاولة قهوة', 'ترابيزة انترية', 'طاولة وسط'],
    mapping: { category: 'Coffee Table', subcategory: 'Tables', defaultRoom: 'Living Room' },
  },
  // TV Units
  {
    keywords: ['tv unit', 'tv stand', 'tv cabinet', 'media console', 'طاولة تلفزيون', 'وحدة تلفزيون', 'طاولة شاشة'],
    mapping: { category: 'TV Unit', subcategory: 'Media Furniture', defaultRoom: 'Living Room' },
  },
  // Side Tables
  {
    keywords: ['side table', 'end table', 'accent table', 'طاولة جانبية', 'ترابيزة جانبية'],
    mapping: { category: 'Side Table', subcategory: 'Tables', defaultRoom: 'Living Room' },
  },
  // Rugs
  {
    keywords: ['rug', 'carpet', 'mat', 'runner rug', 'سجادة', 'سجاد', 'مشاية'],
    mapping: { category: 'Rug', subcategory: 'Floor Coverings', defaultRoom: 'Living Room' },
  },
  // Curtains
  {
    keywords: ['curtain', 'drapes', 'drape', 'blind', 'ستارة', 'ستائر'],
    mapping: { category: 'Curtain', subcategory: 'Window Treatment', defaultRoom: 'Living Room' },
  },
  // Lamps & Lighting
  {
    keywords: ['lamp', 'pendant', 'chandelier', 'floor lamp', 'table lamp', 'lighting', 'مصباح', 'نجفة', 'اباجورة', 'أباجورة', 'إضاءة'],
    mapping: { category: 'Lamp', subcategory: 'Lighting', defaultRoom: 'Living Room' },
  },
  // Wall Art / Paintings
  {
    keywords: ['wall art', 'painting', 'canvas', 'poster', 'frame', 'لوحة', 'تابلوه', 'برقاع', 'لوحات جدارية'],
    mapping: { category: 'Wall Art', subcategory: 'Decor', defaultRoom: 'Decor' },
  },
  // Plants & Vases
  {
    keywords: ['plant', 'planter', 'artificial plant', 'flower pot', 'vase', 'نبات', 'مزهرية', 'فازة', 'زهور'],
    mapping: { category: 'Plant', subcategory: 'Botanical Decor', defaultRoom: 'Decor' },
  },
  // Beds
  {
    keywords: ['bed', 'headboard', 'bed frame', 'سرير', 'سرير نوم', 'ظهر سرير'],
    mapping: { category: 'Bed', subcategory: 'Beds', defaultRoom: 'Bedroom' },
  },
  // Mattresses
  {
    keywords: ['mattress', 'مرتبة', 'مرتبة نوم', 'مفارش'],
    mapping: { category: 'Mattress', subcategory: 'Bedding', defaultRoom: 'Bedroom' },
  },
  // Nightstands
  {
    keywords: ['nightstand', 'bedside table', 'bedside', 'كومودينو', 'كومود', 'طاولة سرير'],
    mapping: { category: 'Nightstand', subcategory: 'Bedroom Tables', defaultRoom: 'Bedroom' },
  },
  // Dressers & Vanity
  {
    keywords: ['dresser', 'vanity', 'chest of drawers', 'تسريحة', 'وحدة ادراج', 'شفونيرة'],
    mapping: { category: 'Dresser', subcategory: 'Storage', defaultRoom: 'Bedroom' },
  },
  // Wardrobes & Closets
  {
    keywords: ['wardrobe', 'closet', 'armoire', 'دولاب', 'خزانة ملابس'],
    mapping: { category: 'Wardrobe', subcategory: 'Storage', defaultRoom: 'Bedroom' },
  },
  // Mirrors
  {
    keywords: ['mirror', 'wall mirror', 'full length mirror', 'مرآة', 'مراية'],
    mapping: { category: 'Mirror', subcategory: 'Wall Decor', defaultRoom: 'Decor' },
  },
  // Dining Tables
  {
    keywords: ['dining table', 'kitchen table', 'ترابيزة سفرة', 'طاولة طعام', 'سفرة'],
    mapping: { category: 'Dining Table', subcategory: 'Dining Furniture', defaultRoom: 'Kitchen' },
  },
  // Dining Chairs / Bar Stools
  {
    keywords: ['dining chair', 'kitchen chair', 'bar stool', 'stool', 'كرسي سفرة', 'كرسي طعام', 'كرسي بار'],
    mapping: { category: 'Dining Chair', subcategory: 'Dining Furniture', defaultRoom: 'Kitchen' },
  },
  // Cabinets & Buffets
  {
    keywords: ['cabinet', 'buffet', 'sideboard', 'cupboard', 'بوفيه', 'نيش', 'خزانة', 'دولاب مطبخ'],
    mapping: { category: 'Cabinet', subcategory: 'Storage', defaultRoom: 'Kitchen' },
  },
  // Kitchen Islands
  {
    keywords: ['kitchen island', 'trolley', 'cart', 'جزيرة مطبخ', 'عربة مطبخ'],
    mapping: { category: 'Kitchen Island', subcategory: 'Kitchen Storage', defaultRoom: 'Kitchen' },
  },
  // Office Chairs
  {
    keywords: ['office chair', 'desk chair', 'executive chair', 'gaming chair', 'كرسي مكتب', 'كرسي دراسة'],
    mapping: { category: 'Office Chair', subcategory: 'Office Seating', defaultRoom: 'Office' },
  },
  // Desks
  {
    keywords: ['desk', 'writing desk', 'office desk', 'computer desk', 'مكتب', 'طاولة مكتب', 'مكتب دراسة'],
    mapping: { category: 'Desk', subcategory: 'Office Desks', defaultRoom: 'Office' },
  },
  // Bookcases / Shelves
  {
    keywords: ['bookcase', 'bookshelf', 'shelf', 'shelving', 'مكتبة', 'ارفف', 'أرفف', 'وحدة رفوف'],
    mapping: { category: 'Bookcase', subcategory: 'Shelving & Storage', defaultRoom: 'Office' },
  },
  // Decorative Objects / Clocks
  {
    keywords: ['clock', 'wall clock', 'sculpture', 'figurine', 'decorative object', 'ساعة جدارية', 'ساعة حائط', 'ديكور', 'تحفة'],
    mapping: { category: 'Decorative Object', subcategory: 'Accent Decor', defaultRoom: 'Decor' },
  },
];

const EXCLUDED_KEYWORDS = [
  'phone', 'mobile', 'laptop', 'shirt', 'dress', 'shoes', 'pants', 't-shirt', 'shampoo',
  'perfume', 'makeup', 'toy', 'game', 'groceries', 'food', 'snack', 'watch', 'jewel',
  'waffle', 'sandwich', 'fryer', 'kettle', 'blender', 'mixer', 'fan', 'heater', 'scrub',
  'tissue', 'glove', 'soap', 'cleaner', 'vacuum', 'cooker', 'microwave', 'refrigerator',
  'fridge', 'iron', 'toaster', 'juicer', 'processor', 'clip', 'clips',
  'موبايل', 'هاتف', 'قميص', 'فستان', 'حذاء', 'عطر', 'لعبة', 'طعام', 'ساعة يد', 'خلاط',
  'قلاية', 'مروحة', 'مناديل', 'صابون', 'منظف', 'مكواة', 'ميكروويف', 'موقد', 'ثلاجة'
];

export function isFurnishingProduct(name: string, rawCategory: string = ''): boolean {
  const combined = `${name} ${rawCategory}`.toLowerCase();
  for (const ex of EXCLUDED_KEYWORDS) {
    if (combined.includes(ex)) {
      return false;
    }
  }
  for (const item of CATEGORY_MAP) {
    for (const kw of item.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        return true;
      }
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

  return {
    category: 'Decorative Object',
    subcategory: 'General Furnishing',
    defaultRoom: 'Decor',
  };
}
