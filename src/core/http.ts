import fs from 'fs';
import path from 'path';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './logger.js';
import { RobotsChecker } from './robots.js';

function loadEnvFile(envPath: string = '.env') {
  try {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let value = trimmed.slice(eqIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (e) {}
}

interface HeaderProfile {
  userAgent: string;
  secChUa: string;
  secChUaPlatform: string;
}

const HEADER_PROFILES: HeaderProfile[] = [
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    secChUaPlatform: '"macOS"',
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    secChUaPlatform: '"Windows"',
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    secChUa: '"Not/A)Brand";v="8", "Chromium";v="125", "Google Chrome";v="125"',
    secChUaPlatform: '"macOS"',
  },
];

function parseProxyUrl(proxyUrlStr?: string): AxiosRequestConfig['proxy'] {
  if (!proxyUrlStr) return undefined;
  try {
    const u = new URL(proxyUrlStr);
    return {
      protocol: u.protocol.replace(':', ''),
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80),
      ...(u.username ? { auth: { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) } } : {}),
    };
  } catch (e) {
    return undefined;
  }
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private delayMs: number;
  private maxRetries: number;
  private cookieStore: Map<string, string[]> = new Map();

  constructor(delayMs: number = 300, maxRetries: number = 1, timeoutMs: number = 15000) {
    loadEnvFile();
    this.delayMs = delayMs;
    this.maxRetries = maxRetries;

    const proxyEnv = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY_URL || process.env.SCRAPER_PROXY;
    const proxyConfig = parseProxyUrl(proxyEnv);

    if (proxyConfig) {
      logger.info(`[HTTP Client] Using proxy server: ${proxyConfig.host}:${proxyConfig.port}`);
    }

    this.axiosInstance = axios.create({
      timeout: timeoutMs,
      ...(proxyConfig ? { proxy: proxyConfig } : {}),
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'upgrade-insecure-requests': '1',
      },
    });
  }

  private getRandomHeaderProfile(): HeaderProfile {
    return HEADER_PROFILES[Math.floor(Math.random() * HEADER_PROFILES.length)];
  }

  private getDomain(urlStr: string): string {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return '';
    }
  }

  private updateCookies(domain: string, setCookieHeader?: string | string[]) {
    if (!domain || !setCookieHeader) return;
    const newCookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    const existing = this.cookieStore.get(domain) || [];

    for (const cookieStr of newCookies) {
      const pair = cookieStr.split(';')[0];
      if (pair && pair.includes('=')) {
        const key = pair.split('=')[0].trim();
        const filtered = existing.filter(c => !c.startsWith(`${key}=`));
        filtered.push(pair.trim());
        this.cookieStore.set(domain, filtered);
      }
    }
  }

  private getCookieHeader(domain: string): string | undefined {
    const cookies = this.cookieStore.get(domain);
    return cookies && cookies.length > 0 ? cookies.join('; ') : undefined;
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

    const effectiveRetries = Math.max(1, retries);
    let attempt = 0;

    while (attempt <= effectiveRetries) {
      try {
        if (this.delayMs > 0) {
          // Add jitter to delay (0-300ms random offset)
          await this.sleep(this.delayMs + Math.floor(Math.random() * 300));
        }

        const profile = this.getRandomHeaderProfile();
        const domain = this.getDomain(url);
        const existingCookies = this.getCookieHeader(domain);

        let referer = options.headers?.Referer || options.headers?.referer;
        if (!referer) {
          try {
            const parsed = new URL(url);
            referer = `${parsed.protocol}//${parsed.hostname}/`;
          } catch (e) {}
        }

        const mergedHeaders = {
          'User-Agent': profile.userAgent,
          'sec-ch-ua': profile.secChUa,
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': profile.secChUaPlatform,
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          ...(existingCookies ? { 'Cookie': existingCookies } : {}),
          ...(referer ? { 'Referer': referer } : {}),
          ...options.headers,
        };

        let requestProxy: AxiosRequestConfig['proxy'] = options.proxy;
        if (!requestProxy) {
          if (url.includes('noon.com') && process.env.NOON_PROXY) {
            requestProxy = parseProxyUrl(process.env.NOON_PROXY);
          } else if (url.includes('jumia.com') && process.env.JUMIA_PROXY) {
            requestProxy = parseProxyUrl(process.env.JUMIA_PROXY);
          } else if (url.includes('ikea.com') && process.env.IKEA_PROXY) {
            requestProxy = parseProxyUrl(process.env.IKEA_PROXY);
          } else if (url.includes('amazon.') && process.env.AMAZON_PROXY) {
            requestProxy = parseProxyUrl(process.env.AMAZON_PROXY);
          }
        }

        const response = await this.axiosInstance.get(url, {
          ...options,
          ...(requestProxy !== undefined ? { proxy: requestProxy } : {}),
          headers: mergedHeaders,
        });

        // Store session cookies returned by WAF/server
        if (response.headers['set-cookie']) {
          this.updateCookies(domain, response.headers['set-cookie']);
        }

        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } catch (err: any) {
        attempt++;
        const status = err.response?.status;
        const domain = this.getDomain(url);
        logger.warn(`[HTTP Fetch] Failed ${url} - Status/Error: ${status || err.code || err.message}`);

        // If Cloudflare JS Challenge (403 Forbidden) is detected on cloud server, run CF bypass
        if (status === 403 && attempt === 1) {
          try {
            const { CloudflareBypass } = await import('./cf-bypass.js');
            const cfCookies = await CloudflareBypass.getSessionCookies(url);
            if (cfCookies) {
              this.updateCookies(domain, cfCookies.split('; '));
            }
          } catch (cfErr: any) {
            logger.warn(`[HTTP Fetch] CF bypass attempt error: ${cfErr.message}`);
          }
        }

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
