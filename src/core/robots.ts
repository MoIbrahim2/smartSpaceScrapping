import robotsParser from 'robots-parser';
import axios from 'axios';
import { logger } from './logger.js';

export class RobotsChecker {
  private static cache = new Map<string, ReturnType<typeof robotsParser>>();
  private static DEFAULT_USER_AGENT = 'SmartSpaceAIBot/1.0 (+https://smartspaceai.com/bot)';

  public static async isAllowed(url: string, userAgent: string = this.DEFAULT_USER_AGENT): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const origin = parsedUrl.origin;

      if (!this.cache.has(origin)) {
        const robotsUrl = `${origin}/robots.txt`;
        try {
          const resp = await axios.get(robotsUrl, {
            timeout: 5000,
            headers: { 'User-Agent': userAgent },
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
