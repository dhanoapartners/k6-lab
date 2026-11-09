/**
 * 02 Shopping journey: a realistic user flow, step by step, with its own timings.
 *
 * Search → open a product → add to cart → sign in → place an order.
 * Shows groups, a custom Trend metric, checks on business values, and correlation
 * (the sign-in token from one response is sent with the next request).
 * Safe on the live site with the default 1 user; use LAB_URL for more.
 * Run: k6 run scripts/02-shopping-journey.ts
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { API, IS_LIVE, sessionHeaders } from '../lib/lab.ts';

const orderTime = new Trend('order_place_duration', true);

export const options = {
  vus: IS_LIVE ? 1 : 5,
  iterations: IS_LIVE ? 3 : 25,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    order_place_duration: ['p(95)<2000'],
    'group_duration{group:::checkout}': ['p(95)<4000'],
  },
};

export default function () {
  const headers = sessionHeaders();

  group('browse', () => {
    const search = http.get(`${API}/products?q=speaker`, { headers });
    check(search, { 'search finds the speaker': (r) => (r.json('items') as { id: string }[]).some((p) => p.id === 'p-1017') });
    sleep(1);
    const product = http.get(`${API}/products/p-1017`, { headers });
    check(product, { 'product page is 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('checkout', () => {
    const add = http.post(`${API}/cart/items`, JSON.stringify({ productId: 'p-1017', qty: 2 }), { headers });
    check(add, { 'added to cart': (r) => r.status === 201 });

    const cart = http.get(`${API}/cart?promo=SAVE10`, { headers });
    check(cart, {
      'cart has 2 items': (r) => r.json('count') === 2,
      'SAVE10 takes $11.80 off': (r) => r.json('discount') === 11.8,
    });

    // Correlation: take the token from the login response and send it with the order.
    const login = http.post(`${API}/auth/login`, JSON.stringify({ username: 'standard_user', password: 'practice123' }), { headers });
    const token = login.json('token') as string;
    check(login, { 'signed in': () => Boolean(token) });

    const order = http.post(`${API}/orders`, JSON.stringify({
      promo: 'SAVE10',
      shipping: { name: 'Sam Standard', email: 'sam@example.com', address: '100 Main St', city: 'San Ramon', state: 'CA', zip: '94583' },
    }), { headers: { ...headers, Authorization: `Bearer ${token}` } });
    orderTime.add(order.timings.duration);
    check(order, { 'order placed': (r) => r.status === 201 && /^KM-\d{5}$/.test(r.json('orderId') as string) });
  });

  sleep(2);
}
