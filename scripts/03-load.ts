/**
 * 03 Load: the expected busy-hour traffic, held steady.
 *
 * Ramps to 20 users, holds, ramps down. LOCAL ONLY: it refuses to run against the live site.
 * Run: LAB_URL=http://localhost:8788 k6 run scripts/03-load.ts
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { API, requireLocal, sessionHeaders } from '../lib/lab.ts';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up
    { duration: '1m', target: 20 },  // hold the busy hour
    { duration: '15s', target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export function setup() {
  requireLocal('03-load');
}

export default function () {
  const headers = sessionHeaders();
  const pages = ['/products', '/products?category=Electronics', '/products?sort=price_asc', '/products/p-1017', '/products/p-1017/reviews?page=1'];
  const r = http.get(`${API}${pages[Math.floor(Math.random() * pages.length)]}`, { headers });
  check(r, { 'status is 200': (res) => res.status === 200 });
  sleep(Math.random() * 2 + 1); // 1–3 s think time
}
