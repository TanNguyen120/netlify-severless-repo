import { handler } from '../netlify/functions/comps';

describe('Netlify handler', () => {
  beforeEach(() => {
    // Reset cache before each test
    (global as any).cache = {};
  });

  it('should return cached data when available', async () => {
    (global as any).cache = {
      data: { test: true },
      timestamp: Date.now(),
    };

    const result = await handler(
      { queryStringParameters: { q: 'nintendo 3ds' } } as any,
      {} as any
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).cached).toBe(true);
  });

  it('should fetch new data if no cache', async () => {
    const result = await handler(
      { queryStringParameters: { q: 'nintendo 3ds' } } as any,
      {} as any
    );

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.items.length).toBeGreaterThan(0);
  });
});
