// netlify/functions/myFunction.ts
import { Handler } from '@netlify/functions';
import scrapingbee from 'scrapingbee'; // Importing SPB's SDK
import 'dotenv/config'; // Import and configure dotenv
import * as cheerio from 'cheerio';
import { parse } from 'dotenv';

const handler: Handler = async (event: any, context: any) => {
  // Your function logic here
  const message = `Hello from Netlify Function in TypeScript!`;
  const { q } = event.queryStringParameters;
  console.log(`Item Name: ${q}`);
  const formatItemName = q.replace(/ /g, '+');
  console.log(`Formatted Item Name: ${formatItemName}`);
  const scrapURL = `https://www.ebay.com/sch/i.html?_nkw=${formatItemName}&_sop=12&LH_Sold=1&LH_Complete=1`;
  const client = new scrapingbee.ScrapingBeeClient(process.env.BEE_KEY || '');
  const response = await client.get({
    url: scrapURL,
    // params: {
    //   extract_rules: {
    //     items: {
    //       selector: '.su-card-container',
    //       type: 'list',
    //       output: {
    //         tile: '.s-card__title',
    //         price: '.s-card__price',
    //         soldDate: 's-card__caption',

    //       },
    //     },
    //   },
    // },
  });
  // const decoder = new TextDecoder();
  // const text = decoder.decode(response.data);
  // const textJSON = JSON.parse(text);
  // console.log(`ScrapingBee Response: `);
  // console.log(textJSON);
  const rawHTML = await response.data;
  const text = extractItemsFromHTML(rawHTML);
  console.log(text);
  const stats = calculateSalesMetrics(text);
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: q,
      stats,
      items: text,
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

    if (title !== 'Shop on eBay' && parsedPrice && soldDate && condition) {
      const beautyCondition = condition.replace(' · ', '');
      items.push({
        title,
        price: parsedPrice?.value,
        currency: parsedPrice?.symbol,
        soldDate: convertToDate(soldDate),
        condition: beautyCondition,
        imageUrl,
        itemUrl,
      });
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
  console.log(parts);
  const month = new Date(Date.parse(parts[1] + ' 1, 2020')).getMonth();
  const day = parseInt(parts[2], 10);
  const year = parseInt(parts[3], 10);
  const date = new Date(Date.UTC(year, month, day));
  return date.toISOString();
}
