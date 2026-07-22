import robotsParser from 'robots-parser';
import axios from 'axios';
import { logger } from './logger.js';

export class RobotsChecker {
  private static cache = new Map<string, ReturnType<typeof robotsParser>>();
  private static DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

  public static async isAllowed(url: string, userAgent: string = this.DEFAULT_USER_AGENT): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const origin = parsedUrl.origin;

      if (!this.cache.has(origin)) {
        const robotsUrl = `${origin}/robots.txt`;
        try {
          const resp = await axios.get(robotsUrl, {
            timeout: 5000,
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });
          const parser = robotsParser(robotsUrl, resp.data);
          this.cache.set(origin, parser);
        } catch (err: any) {
          logger.warn(`Could not fetch robots.txt for ${origin}: ${err.message}. Defaulting to ALLOW.`);
          const parser = robotsParser(robotsUrl, 'User-agent: *\nAllow: /');
          this.cache.set(origin, parser);
        }
      }

      const parser = this.cache.get(origin);
      const allowed = parser ? parser.isAllowed(url, userAgent) ?? true : true;
      if (!allowed) {
        logger.warn(`[Robots.txt] Crawl DISALLOWED for URL: ${url}`);
      }
      return allowed;
    } catch (err: any) {
      logger.error(`Error parsing robots.txt for ${url}: ${err.message}`);
      return true;
    }
  }
}
