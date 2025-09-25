// netlify/functions/myFunction.ts
import { Handler } from '@netlify/functions';
import scrapingbee from 'scrapingbee'; // Importing SPB's SDK
import 'dotenv/config'; // Import and configure dotenv
import * as cheerio from 'cheerio';
import { parse } from 'dotenv';

// in-memory cache for 60 minutes
const cache: { data: any; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

const handler: Handler = async (event: any, context: any) => {
  const durationFromLastFetch = cache.timestamp
    ? Date.now() - cache.timestamp
    : null;
  if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
    console.log('Returning cached data');
    return {
      statusCode: 200,
      body: JSON.stringify(cache.data),
    };
  }
  // Your function logic here
  const { q } = event.queryStringParameters;

  const formatItemName = q.replace(/ /g, '+');

  const scrapURL = `https://www.ebay.com/sch/i.html?_nkw=${formatItemName}&_sop=12&LH_Sold=1&LH_Complete=1`;
  const client = new scrapingbee.ScrapingBeeClient(process.env.BEE_KEY || '');
  const response = await client.get({
    url: scrapURL,
  });

  const rawHTML = await response.data;
  const text = extractItemsFromHTML(rawHTML);
  const stats = calculateSalesMetrics(text);
  cache.data = {
    query: q,
    stats,
    items: text,
    source: 'scrapingbee',
    cached: true,
  };
  cache.timestamp = Date.now();
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: q,
      stats,
      items: text,
      source: 'scrapingbee',
      cached: false,
    }),
  };
};

export { handler };

function extractItemsFromHTML(html: string) {
  const $ = cheerio.load(html);
  const items: any[] = [];
  console.log(`Extracting items from HTML...`);
  $('.su-card-container').each((index, element) => {
    const title = $(element).find('.s-card__title').text();
    const price = $(element).find('.s-card__price').text();
    const soldDate = $(element).find('.s-card__caption').text();
    const subtile = $(element).find('.s-card__subtitle');
    const condition = subtile.find('span').first().text();
    const imageDiv = $(element).find('.su-media__image');
    const imageUrl = imageDiv.find('img').attr('src');
    const itemUrl = imageDiv.find('a').attr('href');
    const parsedPrice = parsePrice(price);
    let shipping = null;
    let shippingCost = null;
    // sometimes shipping info is in the second child of .su-card-container__attributes__primary
    // and sometimes it's not there at all
    const shippingInfo = $(element)
      .find('.su-card-container__attributes__primary')
      .children();
    if (shippingInfo.length > 1) {
      const shippingText = $(shippingInfo[2]).text();
      shippingCost = getShippingCost(shippingText);
    }
    if (title !== 'Shop on eBay' && parsedPrice && soldDate && condition) {
      const beautyCondition = condition.replace(' · ', '');
      const resultData = {
        title,
        price: parsedPrice?.value,
        currency: parsedPrice?.symbol,
        soldDate: convertToDate(soldDate),
        condition: beautyCondition,
        imageUrl,
        itemUrl,
        shipping: shippingCost,
      };
      items.push(resultData);
    }
  });
  return items;
}

function parsePrice(
  priceStr: string
): { value: number; currency: string; symbol: string } | null {
  const parseCurrency = require('parsecurrency');
  if (priceStr.trim() === '') {
    return null;
  }
  const parsed = parseCurrency(priceStr);

  return parsed;
}

function calculateSalesMetrics(items: any[]) {
  const totalSales = items.length;
  const p75 = quantile(
    items.map((item) => item.price),
    0.75
  );
  const p25 = quantile(
    items.map((item) => item.price),
    0.25
  );
  const median = quantile(
    items.map((item) => item.price),
    0.5
  );
  return {
    count: totalSales,
    p25,
    median,
    p75,
  };
}

function quantile(arr: number[], q: number) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

// convert "Sold Sep 23, 2025" to Date UTC ISO-8601 UTC date string
function convertToDate(dateStr: string) {
  // Example dateStr: "Sold Sep 23, 2025"
  const parts = dateStr.replace('Sold ', '').split(' ');

  const month = new Date(Date.parse(parts[1] + ' 1, 2020')).getMonth();
  const day = parseInt(parts[2], 10);
  const year = parseInt(parts[3], 10);
  const date = new Date(Date.UTC(year, month, day));
  return date.toISOString();
}

// get shipping cost if available
function getShippingCost(shippingText: string) {
  let shippingCost = 0;

  if (shippingText) {
    if (
      !shippingText.toLowerCase().includes('free') &&
      shippingText.includes('delivery')
    ) {
      let formattedShipping = shippingText.replace(' delivery', '');
      formattedShipping = formattedShipping.replace('+', '');
      const parsedShipping = parsePrice(formattedShipping);
      if (parsedShipping) {
        shippingCost = parsedShipping.value;
      }
    }
  }

  return shippingCost;
}
