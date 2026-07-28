import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger.js';
import { RobotsChecker } from './robots.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private delayMs: number;
  private maxRetries: number;

  constructor(delayMs: number = 300, maxRetries: number = 1, timeoutMs: number = 15000) {
    this.delayMs = delayMs;
    this.maxRetries = maxRetries;
    this.axiosInstance = axios.create({
      timeout: timeoutMs,
      headers: {
        'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'upgrade-insecure-requests': '1',
      },
    });
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async fetch(
    url: string,
    options: AxiosRequestConfig & { skipRobots?: boolean } = {},
    retries: number = this.maxRetries
  ): Promise<string | null> {
    if (!options.skipRobots) {
      const isAllowed = await RobotsChecker.isAllowed(url);
      if (!isAllowed) {
        logger.warn(`Skipping URL disallowed by robots.txt: ${url}`);
        return null;
      }
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
        let referer = options.headers?.Referer || options.headers?.referer;
        if (!referer) {
          try {
            const parsed = new URL(url);
            referer = `${parsed.protocol}//${parsed.hostname}/`;
          } catch (e) {}
        }

        const response = await this.axiosInstance.get(url, {
          ...options,
          headers: {
            'User-Agent': userAgent,
            ...(referer ? { 'Referer': referer } : {}),
            ...options.headers,
          },
        });

        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } catch (err: any) {
        attempt++;
        const status = err.response?.status;
        logger.warn(`[HTTP Fetch] Failed ${url} - Status/Error: ${status || err.code || err.message}`);

        if (attempt > effectiveRetries) {
          logger.warn(`Skipping ${url} immediately.`);
          return null;
        }

        const backoffMs = Math.pow(2, attempt) * 800;
        logger.info(`Retrying request to ${url} in ${backoffMs}ms...`);
        await this.sleep(backoffMs);
      }
    }

    return null;
  }
}
