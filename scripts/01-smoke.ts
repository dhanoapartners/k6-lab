/**
 * 01 Smoke: does the site work under the lightest possible load?
 *
 * One virtual user, a few iterations. Safe to run against the live site, and it's what CI runs nightly.
 * Run: k6 run scripts/01-smoke.ts
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { API } from '../lib/lab.ts';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate<0.01'],      // fewer than 1% of requests fail
    http_req_duration: ['p(95)<1500'],   // 95% of requests finish within 1.5 s
    checks: ['rate==1.0'],               // every check passes
  },
};

export default function () {
  const health = http.get(`${API}/health`);
  check(health, { 'health is 200': (r) => r.status === 200 });

  const list = http.get(`${API}/products?limit=8`);
  check(list, {
    'products is 200': (r) => r.status === 200,
    '8 products on the page': (r) => (r.json('items') as unknown[]).length === 8,
  });

  const one = http.get(`${API}/products/p-1017`);
  check(one, { 'speaker costs $59': (r) => r.json('price') === 59 });

  sleep(1); // think time: a real user pauses between pages
}
