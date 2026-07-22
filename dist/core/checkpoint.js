"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_js_1 = require("./logger.js");
class CheckpointManager {
    filePath;
    data;
    constructor(filePath = '.checkpoint.json') {
        this.filePath = path_1.default.resolve(filePath);
        this.data = this.load();
    }
    load() {
        if (fs_1.default.existsSync(this.filePath)) {
            try {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                logger_js_1.logger.info(`Loaded checkpoint from ${this.filePath}`);
                return JSON.parse(raw);
            }
            catch (err) {
                logger_js_1.logger.warn(`Failed to parse checkpoint file, starting fresh: ${err.message}`);
            }
        }
        return {
            lastUpdated: new Date().toISOString(),
            scrapedUrls: {},
            completedCategories: {},
            savedProducts: [],
        };
    }
    save() {
        try {
            this.data.lastUpdated = new Date().toISOString();
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            logger_js_1.logger.error(`Failed to save checkpoint: ${err.message}`);
        }
    }
    isUrlScraped(adapterName, url) {
        const list = this.data.scrapedUrls[adapterName] || [];
        return list.includes(url);
    }
    markUrlScraped(adapterName, url) {
        if (!this.data.scrapedUrls[adapterName]) {
            this.data.scrapedUrls[adapterName] = [];
        }
        if (!this.data.scrapedUrls[adapterName].includes(url)) {
            this.data.scrapedUrls[adapterName].push(url);
        }
    }
    addProduct(product) {
        this.data.savedProducts.push(product);
    }
    getSavedProducts() {
        return this.data.savedProducts;
    }
    clear() {
        this.data = {
            lastUpdated: new Date().toISOString(),
            scrapedUrls: {},
            completedCategories: {},
            savedProducts: [],
        };
        if (fs_1.default.existsSync(this.filePath)) {
            fs_1.default.unlinkSync(this.filePath);
        }
    }
}
exports.CheckpointManager = CheckpointManager;
