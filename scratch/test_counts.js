import { HttpClient } from '../dist/core/http.js';
import * as cheerio from 'cheerio';

async function testCounts() {
  const http = new HttpClient(200, 0, 5000);

  console.log('=== Testing Jumia Category Pagination ===');
  const jumiaHtml = await http.fetch('https://www.jumia.com.eg/ar/home-office-furniture/?page=1');
  if (jumiaHtml) {
    const $ = cheerio.load(jumiaHtml);
    const links = [];
    $('article.prd a.core').each((_, el) => {
      const href = $(el).attr('href');
      if (href) links.push(href);
    });
    console.log(`Jumia Page 1 found ${links.length} products!`);
  }

  console.log('=== Testing Noon API Catalog ===');
  const noonRes = await http.fetch('https://www.noon.com/_svc/catalog/api/v3/u/home-and-kitchen/furniture/living-room-furniture/?page=1&limit=50');
  if (noonRes) {
    try {
      const data = JSON.parse(noonRes);
      const catalog = data.catalog?.grid || data.hits || [];
      console.log(`Noon API Page 1 found ${catalog.length} items out of ${data.nbHits} total hits!`);
    } catch (e) {
      console.log('Error parsing Noon JSON:', e);
    }
  }

  console.log('=== Testing IKEA Catalog ===');
  const ikeaHtml = await http.fetch('https://www.ikea.com/eg/ar/cat/sofas-armchairs-fu003/?page=1');
  if (ikeaHtml) {
    const $ = cheerio.load(ikeaHtml);
    const ikeaLinks = [];
    $('.pip-product-compact a.pip-product-compact__link, a.pip-link, a[href*="/p/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/p/')) ikeaLinks.push(href);
    });
    console.log(`IKEA Page 1 found ${ikeaLinks.length} products!`);
  }
}

testCounts();
