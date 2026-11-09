/**
 * 06 Steady traffic, 5 minutes: a small, realistic background load held long enough to see trends.
 *
 * Two users browse and check their carts for 5 minutes. Short runs only show a moment; five minutes shows
 * whether latency drifts, errors creep in, or anything leaks. Sized for the live site: about 2 requests a
 * second, far under its limit of 100 requests per 10 seconds.
 *
 * Run with the HTML report (open report.html in a browser afterwards):
 *   K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report.html k6 run scripts/06-steady-5min.ts
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { API, sessionHeaders } from '../lib/lab.ts';

export const options = {
  scenarios: {
    steady: { executor: 'constant-vus', vus: 2, duration: '5m' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    'http_req_duration{name:catalog}': ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

const CATEGORIES = ['Electronics', 'Home', 'Kitchen', 'Outdoor', 'Apparel'];

export default function () {
  const headers = sessionHeaders();

  group('browse', () => {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    // The name tag groups all category URLs into one line of the report.
    const list = http.get(`${API}/products?category=${cat}`, { headers, tags: { name: 'catalog' } });
    check(list, { 'catalog is 200': (r) => r.status === 200 });
    sleep(1 + Math.random() * 2);

    const product = http.get(`${API}/products/p-1017`, { headers, tags: { name: 'product' } });
    check(product, { 'product is 200': (r) => r.status === 200 });
    sleep(1 + Math.random() * 2);
  });

  group('cart', () => {
    const add = http.post(`${API}/cart/items`, JSON.stringify({ productId: 'p-1017', qty: 1 }), { headers, tags: { name: 'add to cart' } });
    check(add, { 'added': (r) => r.status === 201 });
    const cart = http.get(`${API}/cart`, { headers, tags: { name: 'cart' } });
    check(cart, { 'cart has the item': (r) => r.json('count') === 1 });
  });

  sleep(2 + Math.random() * 2);
}
