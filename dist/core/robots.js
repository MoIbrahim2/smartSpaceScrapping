"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobotsChecker = void 0;
const robots_parser_1 = __importDefault(require("robots-parser"));
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("./logger.js");
class RobotsChecker {
    static cache = new Map();
    static DEFAULT_USER_AGENT = 'SmartSpaceAIBot/1.0 (+https://smartspaceai.com/bot)';
    static async isAllowed(url, userAgent = this.DEFAULT_USER_AGENT) {
        try {
            const parsedUrl = new URL(url);
            const origin = parsedUrl.origin;
            if (!this.cache.has(origin)) {
                const robotsUrl = `${origin}/robots.txt`;
                try {
                    const resp = await axios_1.default.get(robotsUrl, {
                        timeout: 5000,
                        headers: { 'User-Agent': userAgent },
                    });
                    const parser = (0, robots_parser_1.default)(robotsUrl, resp.data);
                    this.cache.set(origin, parser);
                }
                catch (err) {
                    logger_js_1.logger.warn(`Could not fetch robots.txt for ${origin}: ${err.message}. Defaulting to ALLOW.`);
                    const parser = (0, robots_parser_1.default)(robotsUrl, 'User-agent: *\nAllow: /');
                    this.cache.set(origin, parser);
                }
            }
            const parser = this.cache.get(origin);
            const allowed = parser ? parser.isAllowed(url, userAgent) ?? true : true;
            if (!allowed) {
                logger_js_1.logger.warn(`[Robots.txt] Crawl DISALLOWED for URL: ${url}`);
            }
            return allowed;
        }
        catch (err) {
            logger_js_1.logger.error(`Error parsing robots.txt for ${url}: ${err.message}`);
            return true;
        }
    }
}
exports.RobotsChecker = RobotsChecker;
