"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("./logger.js");
const robots_js_1 = require("./robots.js");
const USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];
class HttpClient {
    axiosInstance;
    delayMs;
    maxRetries;
    constructor(delayMs = 300, maxRetries = 1, timeoutMs = 15000) {
        this.delayMs = delayMs;
        this.maxRetries = maxRetries;
        this.axiosInstance = axios_1.default.create({
            timeout: timeoutMs,
            headers: {
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
            },
        });
    }
    getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async fetch(url, options = {}, retries = this.maxRetries) {
        const isAllowed = await robots_js_1.RobotsChecker.isAllowed(url);
        if (!isAllowed) {
            logger_js_1.logger.warn(`Skipping URL disallowed by robots.txt: ${url}`);
            return null;
        }
        // Guarantee at least 1 retry for transient 403/503 anti-bot WAF blocks
        const effectiveRetries = Math.max(1, retries);
        let attempt = 0;
        while (attempt <= effectiveRetries) {
            try {
                if (this.delayMs > 0) {
                    await this.sleep(this.delayMs + Math.floor(Math.random() * 200));
                }
                const userAgent = this.getRandomUserAgent();
                const response = await this.axiosInstance.get(url, {
                    ...options,
                    headers: {
                        'User-Agent': userAgent,
                        ...options.headers,
                    },
                });
                return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            }
            catch (err) {
                attempt++;
                const status = err.response?.status;
                logger_js_1.logger.warn(`[HTTP Fetch] Failed ${url} - Status/Error: ${status || err.code || err.message}`);
                if (attempt > effectiveRetries) {
                    logger_js_1.logger.warn(`Skipping ${url} immediately.`);
                    return null;
                }
                const backoffMs = Math.pow(2, attempt) * 800;
                logger_js_1.logger.info(`Retrying request to ${url} in ${backoffMs}ms...`);
                await this.sleep(backoffMs);
            }
        }
        return null;
    }
}
exports.HttpClient = HttpClient;
