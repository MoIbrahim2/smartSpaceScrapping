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

  constructor(delayMs: number = 1000, maxRetries: number = 0, timeoutMs: number = 6000) {
    this.delayMs = delayMs;
    this.maxRetries = maxRetries;
    this.axiosInstance = axios.create({
      timeout: timeoutMs,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
    });
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async fetch(url: string, options: AxiosRequestConfig = {}, retries: number = this.maxRetries): Promise<string | null> {
    const isAllowed = await RobotsChecker.isAllowed(url);
    if (!isAllowed) {
      logger.warn(`Skipping URL disallowed by robots.txt: ${url}`);
      return null;
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        if (this.delayMs > 0) {
          await this.sleep(this.delayMs + Math.floor(Math.random() * 200)); // Rate limit delay with jitter
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
      } catch (err: any) {
        attempt++;
        const status = err.response?.status;
        logger.warn(`[HTTP Fetch] Failed ${url} - Status/Error: ${status || err.code || err.message}`);

        if (attempt > retries) {
          logger.warn(`Skipping ${url} immediately (max retries = ${retries}).`);
          return null;
        }

        const backoffMs = Math.pow(2, attempt) * 1000;
        logger.info(`Retrying in ${backoffMs}ms...`);
        await this.sleep(backoffMs);
      }
    }

    return null;
  }
}
