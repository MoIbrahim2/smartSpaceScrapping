import { logger } from './logger.js';

export class CloudflareBypass {
  private static cachedCookies: string | null = null;
  private static lastFetched: number = 0;
  private static TTL_MS = 25 * 60 * 1000; // 25 minutes

  public static async getSessionCookies(targetUrl: string = 'https://www.jumia.com.eg/'): Promise<string | null> {
    const now = Date.now();
    if (this.cachedCookies && now - this.lastFetched < this.TTL_MS) {
      return this.cachedCookies;
    }

    try {
      // Dynamic import to allow optional Playwright dependency
      const playwrightModule = 'playwright';
      const { chromium } = await import(/* ts-ignore */ playwrightModule);

      logger.info(`[CF Bypass] Launching headless browser to solve Cloudflare challenge for ${targetUrl}...`);

      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      const page = await context.newPage();

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);

      const cookies = await context.cookies();
      await browser.close();

      const cookieHeader = cookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ');

      if (cookieHeader.length > 0) {
        logger.info(`[CF Bypass] Successfully obtained Cloudflare session cookies (${cookies.length} cookies).`);
        this.cachedCookies = cookieHeader;
        this.lastFetched = Date.now();
        return cookieHeader;
      }

      logger.warn('[CF Bypass] Warning: No Cloudflare clearance cookies detected.');
      return null;
    } catch (err: any) {
      if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
        logger.warn(`[CF Bypass] Playwright not installed. Run "npm install playwright" on your server for auto-bypassing Cloudflare 403s.`);
      } else {
        logger.error(`[CF Bypass] Failed to pass Cloudflare challenge: ${err.message}`);
      }
      return null;
    }
  }
}
