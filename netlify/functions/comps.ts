// netlify/functions/myFunction.ts
import { Handler } from '@netlify/functions';
import scrapingbee from 'scrapingbee'; // Importing SPB's SDK
import 'dotenv/config'; // Import and configure dotenv

// async function getProductData(url: string) {
//   const client = new scrapingbee.ScrapingBeeClient('YOUR-API-KEY'); // New ScrapingBee client
//   var response = await client.get({
//     url: url,
//     params: {
//       // Parameters:
//       extract_rules: {
//         // Data extraction
//         title: 'h1',
//         subtitle: 'span.text-20',
//       },
//     },
//   });
//   return response;
// }

const handler: Handler = async (event: any, context: any) => {
  // Your function logic here
  const message = `Hello from Netlify Function in TypeScript!`;
  const { q } = event.queryStringParameters;
  console.log(`Item Name: ${q}`);
  const formatItemName = q.replace(/ /g, '+');
  console.log(`Formatted Item Name: ${formatItemName}`);
  const scrapURL = `https://www.ebay.com/sch/i.html?_nkw=${formatItemName}`;
  const client = new scrapingbee.ScrapingBeeClient(process.env.BEE_KEY || '');
  const response = await client.get({
    url: scrapURL,
    params: {
      extract_rules: {
        items: {
          selector: '.su-card-container',
          type: 'list',
          output: {
            tile: '.s-card__title',
            price: '.s-card__price',
          },
        },
      },
    },
  });
  const decoder = new TextDecoder();
  const text = decoder.decode(response.data);
  const textJSON = JSON.parse(text);
  console.log(`ScrapingBee Response: `);
  console.log(textJSON);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
      itemName: formatItemName,
      data: text,
    }),
  };
};

export { handler };
