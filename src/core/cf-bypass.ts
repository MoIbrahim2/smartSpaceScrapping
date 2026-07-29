import { logger } from './logger.js';

export class CloudflareBypass {
  private static cachedCookies: string | null = null;
  private static lastFetched: number = 0;
  private static TTL_MS = 25 * 60 * 1000; // 25 minutes
  private static COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown on failure

  public static async getSessionCookies(targetUrl: string = 'https://www.jumia.com.eg/'): Promise<string | null> {
    const now = Date.now();
    if (this.cachedCookies && now - this.lastFetched < this.TTL_MS) {
      return this.cachedCookies;
    }

    // Don't re-launch Playwright constantly if recent attempt failed
    if (!this.cachedCookies && now - this.lastFetched < this.COOLDOWN_MS) {
      return null;
    }

    let rootHtmlUrl = targetUrl;
    try {
      const parsed = new URL(targetUrl);
      if (parsed.hostname.includes('noon.com')) {
        rootHtmlUrl = 'https://www.noon.com/egypt-en/';
      } else if (parsed.hostname.includes('jumia.com')) {
        rootHtmlUrl = 'https://www.jumia.com.eg/';
      } else if (parsed.hostname.includes('ikea.com')) {
        rootHtmlUrl = 'https://www.ikea.com/eg/ar/';
      } else if (parsed.hostname.includes('amazon.')) {
        rootHtmlUrl = 'https://www.amazon.eg/';
      } else {
        rootHtmlUrl = `${parsed.protocol}//${parsed.hostname}/`;
      }
    } catch (e) {}

    try {
      // Dynamic import to allow optional Playwright dependency
      const playwrightModule = 'playwright';
      const { chromium } = await import(/* ts-ignore */ playwrightModule);

      logger.info(`[CF Bypass] Launching browser to solve Cloudflare challenge on ${rootHtmlUrl}...`);

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

      // Use 'commit' so response landing resolves instantly without waiting for DOM hang
      await page.goto(rootHtmlUrl, { waitUntil: 'commit', timeout: 10000 });
      await page.waitForTimeout(4000); // Allow CF challenge script time to execute

      const cookies = await context.cookies();
      await browser.close();

      const cookieHeader = cookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ');

      this.lastFetched = Date.now();

      if (cookieHeader.length > 0) {
        logger.info(`[CF Bypass] Successfully obtained session cookies (${cookies.length} cookies).`);
        this.cachedCookies = cookieHeader;
        return cookieHeader;
      }

      logger.warn('[CF Bypass] Warning: No clearance cookies detected.');
      return null;
    } catch (err: any) {
      this.lastFetched = Date.now();
      if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
        logger.warn(`[CF Bypass] Playwright not installed. Run "npm install playwright" on your server.`);
      } else {
        logger.warn(`[CF Bypass] Browser challenge navigation timeout/error: ${err.message}`);
      }
      return null;
    }
  }
}
