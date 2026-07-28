"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferRoomTypes = inferRoomTypes;
const schema_js_1 = require("../types/schema.js");
const CATEGORY_ROOM_MAP = {
    Sofa: ['living_room', 'game_room'],
    'Coffee Table': ['living_room'],
    'TV Unit': ['living_room', 'game_room'],
    'Side Table': ['living_room', 'bedroom'],
    Rug: ['living_room', 'bedroom', 'kids_room', 'dining_room', 'office', 'game_room'],
    Curtains: ['living_room', 'bedroom', 'dining_room'],
    'Floor Lamp': ['living_room'],
    Bookshelf: ['living_room', 'kids_room', 'office'],
    'Wall Art': ['living_room', 'dining_room'],
    Armchair: ['living_room'],
    Bed: ['bedroom'],
    Wardrobe: ['bedroom'],
    Nightstand: ['bedroom'],
    Dresser: ['bedroom'],
    'Table Lamp': ['bedroom'],
    Mirror: ['bedroom'],
    'Bedroom Armchair': ['bedroom'],
    'Kids Bed': ['kids_room'],
    'Kids Wardrobe': ['kids_room'],
    'Study Desk': ['kids_room'],
    'Study Chair': ['kids_room'],
    'Storage Unit': ['kids_room', 'game_room'],
    'Wall Decor': ['kids_room'],
    'Night Light': ['kids_room'],
    'Dining Table': ['dining_room'],
    'Dining Chairs': ['dining_room'],
    'Buffet Sideboard': ['dining_room'],
    Chandelier: ['dining_room'],
    'Kitchen Cabinet Set': ['kitchen'],
    Countertop: ['kitchen'],
    'Kitchen Island': ['kitchen'],
    'Storage Rack': ['kitchen'],
    'Bar Stool': ['kitchen'],
    'Kitchen Lighting': ['kitchen'],
    'Wall Shelf': ['kitchen'],
    'Vanity Unit': ['bathroom'],
    'Shower Enclosure': ['bathroom'],
    Toilet: ['bathroom'],
    'Mirror Cabinet': ['bathroom'],
    Shelving: ['bathroom'],
    'Towel Rack': ['bathroom'],
    'Accessories Set': ['bathroom'],
    'Bathroom Lighting': ['bathroom'],
    'Office Desk': ['office'],
    'Office Chair': ['office'],
    'Filing Cabinet': ['office'],
    'Desk Lamp': ['office'],
    Whiteboard: ['office'],
    'Gaming Desk': ['game_room'],
    'Gaming Chair': ['game_room'],
    'LED Lighting': ['game_room'],
    'Sound System Stand': ['game_room'],
    'Outdoor Seating': ['balcony'],
    'Outdoor Table': ['balcony'],
    Planter: ['balcony'],
    'Outdoor Lighting': ['balcony'],
    'Outdoor Rug': ['balcony'],
    Swing: ['balcony']
};
function inferRoomTypes(category, text = '', seedRoom) {
    const rooms = new Set();
    if (seedRoom) {
        const cleanSeed = seedRoom.toLowerCase().replace(/\s+/g, '_');
        if (schema_js_1.ALLOWED_ROOM_TYPES.includes(cleanSeed)) {
            rooms.add(cleanSeed);
        }
    }
    const mapped = CATEGORY_ROOM_MAP[category];
    if (mapped) {
        mapped.forEach((r) => rooms.add(r));
    }
    const lowerText = text.toLowerCase();
    if (lowerText.includes('living room') || lowerText.includes('غرفة معيشة') || lowerText.includes('انتريه')) {
        rooms.add('living_room');
    }
    if (lowerText.includes('bedroom') || lowerText.includes('غرفة نوم')) {
        rooms.add('bedroom');
    }
    if (lowerText.includes('kitchen') || lowerText.includes('dining') || lowerText.includes('مطبخ') || lowerText.includes('سفرة')) {
        if (lowerText.includes('kitchen'))
            rooms.add('kitchen');
        if (lowerText.includes('dining') || lowerText.includes('سفرة'))
            rooms.add('dining_room');
    }
    if (lowerText.includes('bathroom') || lowerText.includes('حمّام') || lowerText.includes('حمام')) {
        rooms.add('bathroom');
    }
    if (lowerText.includes('office') || lowerText.includes('study') || lowerText.includes('مكتب')) {
        rooms.add('office');
    }
    if (lowerText.includes('balcony') || lowerText.includes('garden') || lowerText.includes('حديقة') || lowerText.includes('بلكونة')) {
        rooms.add('balcony');
    }
    if (rooms.size === 0) {
        rooms.add('living_room'); // Default neutral fallback
    }
    return Array.from(rooms);
}
