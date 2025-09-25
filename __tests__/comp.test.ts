import { handler } from '../netlify/functions/comps';
import type { HandlerResponse } from '@netlify/functions';

describe('Netlify serverless function', () => {
  it('should return 200 and cached data', async () => {
    const event = {
      queryStringParameters: { q: 'nintendo 3ds' },
    } as any;

    const context = {} as any;

    // Explicitly cast result to HandlerResponse
    const result = (await handler(event, context)) as HandlerResponse;

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body ?? '{}');
    expect(body).toHaveProperty('query', 'nintendo 3ds');
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('items');
  });

  it('should return fresh data if no cache exists', async () => {
    // reset cache so it's empty
    jest.resetModules();
    const { handler: freshHandler } = await import(
      '../netlify/functions/comps'
    );

    const event = {
      queryStringParameters: { q: 'playstation 5' },
    } as any;

    const context = {} as any;

    const result = (await freshHandler(event, context)) as HandlerResponse;

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body ?? '{}');
    expect(body).toHaveProperty('query', 'playstation 5');
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('items');
    expect(body.cached).toBe(false); // explicitly check for fresh fetch
  });
});
