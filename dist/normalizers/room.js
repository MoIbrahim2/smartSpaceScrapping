"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferRoomTypes = inferRoomTypes;
const schema_js_1 = require("../types/schema.js");
const CATEGORY_ROOM_MAP = {
    Sofa: ['Living Room'],
    'Coffee Table': ['Living Room'],
    'TV Unit': ['Living Room'],
    'Side Table': ['Living Room', 'Bedroom'],
    Rug: ['Living Room', 'Bedroom'],
    Curtain: ['Living Room', 'Bedroom'],
    Lamp: ['Living Room', 'Bedroom', 'Office'],
    'Wall Art': ['Living Room', 'Bedroom', 'Decor'],
    Plant: ['Living Room', 'Bedroom', 'Decor', 'Office'],
    Shelf: ['Living Room', 'Office', 'Bathroom'],
    'Storage Unit': ['Living Room', 'Office', 'Bedroom'],
    Bed: ['Bedroom'],
    Mattress: ['Bedroom'],
    Nightstand: ['Bedroom'],
    Dresser: ['Bedroom'],
    Wardrobe: ['Bedroom'],
    Mirror: ['Bathroom', 'Bedroom', 'Decor'],
    'Dining Table': ['Kitchen'],
    'Dining Chair': ['Kitchen'],
    Cabinet: ['Kitchen', 'Bathroom', 'Living Room'],
    'Bar Stool': ['Kitchen'],
    'Kitchen Island': ['Kitchen'],
    'Office Chair': ['Office'],
    Desk: ['Office'],
    Bookcase: ['Office', 'Living Room'],
    Vase: ['Decor', 'Living Room'],
    Clock: ['Decor', 'Living Room', 'Kitchen'],
    'Decorative Object': ['Decor', 'Living Room'],
};
function inferRoomTypes(category, text = '', seedRoom) {
    const rooms = new Set();
    if (seedRoom && schema_js_1.ALLOWED_ROOM_TYPES.includes(seedRoom)) {
        rooms.add(seedRoom);
    }
    const mapped = CATEGORY_ROOM_MAP[category];
    if (mapped) {
        mapped.forEach((r) => rooms.add(r));
    }
    const lowerText = text.toLowerCase();
    if (lowerText.includes('living room') || lowerText.includes('غرفة معيشة') || lowerText.includes('انتريه')) {
        rooms.add('Living Room');
    }
    if (lowerText.includes('bedroom') || lowerText.includes('غرفة نوم')) {
        rooms.add('Bedroom');
    }
    if (lowerText.includes('kitchen') || lowerText.includes('dining') || lowerText.includes('مطبخ') || lowerText.includes('سفرة')) {
        rooms.add('Kitchen');
    }
    if (lowerText.includes('bathroom') || lowerText.includes('حمّام') || lowerText.includes('حمام')) {
        rooms.add('Bathroom');
    }
    if (lowerText.includes('office') || lowerText.includes('study') || lowerText.includes('مكتب')) {
        rooms.add('Office');
    }
    if (rooms.size === 0) {
        rooms.add('Decor');
    }
    return Array.from(rooms);
}
