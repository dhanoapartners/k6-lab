/**
 * 04 Stress and spike: past the expected load, and a sudden burst.
 *
 * Two scenarios in one script. Stress climbs step by step to find where latency and errors start to rise;
 * spike jumps from 0 to many users at once, like a sale going live. LOCAL ONLY.
 * Run: LAB_URL=http://localhost:8788 k6 run scripts/04-stress-and-spike.ts
 * One scenario: add --env SCENARIO=spike (or stress).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { API, requireLocal } from '../lib/lab.ts';

const all = {
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '20s', target: 20 },
      { duration: '20s', target: 40 },
      { duration: '20s', target: 60 },
      { duration: '20s', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-arrival-rate', // requests per second, whatever the response time
    startRate: 1,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 100,
    stages: [
      { duration: '10s', target: 1 },
      { duration: '5s', target: 80 }, // the spike
      { duration: '20s', target: 80 },
      { duration: '10s', target: 1 },
    ],
    startTime: '1m25s',
  },
} as const;

const pick = __ENV.SCENARIO as keyof typeof all | undefined;

export const options = {
  scenarios: pick ? { [pick]: { ...all[pick], startTime: '0s' } } : all,
  thresholds: {
    // Stress tests often fail their thresholds: that's the point. Read where it broke.
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export function setup() {
  requireLocal('04-stress-and-spike');
}

export default function () {
  const r = http.get(`${API}/products?limit=8`);
  check(r, { 'status is 200': (res) => res.status === 200 });
  sleep(0.5);
}
