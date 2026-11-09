/**
 * Shared settings for every script.
 *
 * LAB_URL picks the target. The default is the live training site, which allows only light load
 * (100 API requests per 10 seconds per IP). Heavier tests must run against a local copy of the site.
 */
import { fail } from 'k6';

export const BASE = (__ENV.LAB_URL || 'https://www.dhanoapartners.com').replace(/\/$/, '');
export const API = `${BASE}/api/v1`;
export const IS_LIVE = !/localhost|127\.0\.0\.1/.test(BASE);

/** Stops a heavy script before it starts if it is pointed at the live site. */
export function requireLocal(scriptName: string) {
  if (IS_LIVE) {
    fail(`${scriptName} is a heavy test. Run it against a local copy of the site: LAB_URL=http://localhost:8788 k6 run ...`);
  }
}

/** A fresh session id per virtual user and iteration, so carts never collide. */
export function sessionHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'X-Session-Id': `k6${__VU}x${__ITER}x${Date.now()}` };
}
