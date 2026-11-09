/**
 * 05 Chaos and errors: how does the service behave when it's unreliable?
 *
 * Sends X-Chaos: 1, which adds latency and random 503s. A custom Rate metric counts 503s separately from
 * other failures, and the threshold fails the run only on errors that aren't the expected 503s.
 * Safe on the live site at this size.
 * Run: k6 run scripts/05-chaos-and-errors.ts
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { API } from '../lib/lab.ts';

const unavailable = new Rate('chaos_503_rate');
const realErrors = new Rate('real_error_rate');

export const options = {
  vus: 1,
  iterations: 15,
  thresholds: {
    real_error_rate: ['rate==0'],     // anything other than 200 or 503 is a real bug
    chaos_503_rate: ['rate<0.9'],     // most requests should still get through
  },
};

export default function () {
  const r = http.get(`${API}/products/p-1017`, { headers: { 'X-Chaos': '1' }, responseCallback: http.expectedStatuses(200, 503) });
  unavailable.add(r.status === 503);
  realErrors.add(r.status !== 200 && r.status !== 503);
  check(r, {
    '200 or a clean 503': (res) => res.status === 200 || res.status === 503,
    '503 says when to retry': (res) => res.status !== 503 || Boolean(res.headers['Retry-After']),
  });
  sleep(0.7);
}
