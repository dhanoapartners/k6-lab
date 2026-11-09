# k6 Lab: performance testing with k6

[![k6](https://github.com/dhanoapartners/k6-lab/actions/workflows/k6.yml/badge.svg)](https://github.com/dhanoapartners/k6-lab/actions/workflows/k6.yml)

Training scripts for **[k6](https://k6.io)**, Grafana's open-source load testing tool, run against **[Practice Lab](https://www.dhanoapartners.com)**. Written in TypeScript, which k6 runs directly.

Companion repos: [practice-lab](https://github.com/dhanoapartners/practice-lab) (Playwright) and [ai-agents-lab](https://github.com/dhanoapartners/ai-agents-lab) (MCP and skills).

## Read this first: be kind to the live site

The live site is a shared training environment with a rate limit of **100 API requests per 10 seconds per IP**.

- **Light scripts** (01, 02, 05, 06) are sized to stay far under it, so they're safe on the live site.
- **Heavy scripts** (03, 04) **refuse to run against the live site**. Run them against a local copy (`LAB_URL=http://localhost:8788`).
- Never point a load test at a site you don't own or have permission to test.

## The scripts

| Script | Test type | What it teaches | Where |
|---|---|---|---|
| `01-smoke.ts` | Smoke | Checks, thresholds, think time. Does it work at all under 1 user? | Live or local |
| `02-shopping-journey.ts` | User journey | Groups, a custom `Trend` metric, checks on business values (the SAVE10 discount), **correlation** (a sign-in token reused in the next request) | Live (1 user) or local (5 users) |
| `03-load.ts` | Load | `stages` to ramp up, hold and ramp down; p95/p99 latency gates | Local only |
| `04-stress-and-spike.ts` | Stress + spike | Two `scenarios` in one script, `ramping-vus` vs `ramping-arrival-rate`, reading where a system bends | Local only |
| `06-steady-5min.ts` | Steady load, 5 min | `constant-vus` held long enough to see trends; `name` tags to group URLs; the **HTML report** | Live or local |
| `05-chaos-and-errors.ts` | Resilience | `X-Chaos: 1` (latency and random 503s), custom `Rate` metrics, telling expected errors from real ones | Live or local |

## Setup

1. [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`brew install k6` on a Mac).
2. Clone and run the smoke test:

```bash
git clone https://github.com/dhanoapartners/k6-lab
cd k6-lab
k6 run scripts/01-smoke.ts
```

3. Optional, for editor autocomplete and the typecheck: `npm install`, then `npm run typecheck`.

For the heavy scripts, run a local copy of the site and point at it:

```bash
LAB_URL=http://localhost:8788 k6 run scripts/03-load.ts
LAB_URL=http://localhost:8788 k6 run --env SCENARIO=spike scripts/04-stress-and-spike.ts
```

## How to read the results

- **Thresholds are the pass/fail gate.** A ✓ or ✗ next to each one. If any fails, k6 exits with an error and CI goes red.
- **p95, not the average.** "95% of requests finished within X ms." Averages hide the slow requests users actually feel.
- **`http_req_failed`**: the share of failed requests. Even 1% is a lot at scale.
- **The HTML report.** Add `K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report.html` before `k6 run` to save charts of the whole run. It needs a run of at least about half a minute; `06-steady-5min.ts` is made for it.
- **Checks** are assertions on each response. Unlike thresholds, a failing check doesn't stop the run on its own; add a `checks` threshold to make it count.

## Continuous integration

`.github/workflows/k6.yml` typechecks the scripts, then runs the light scripts against the live site one at a time on every push, pull request and night, and finishes with the 5-minute steady run. Each run writes a results table to the job summary; the steady run also uploads its **HTML report** as an artifact.

## AI with k6

k6 has its own AI tooling: an MCP server (`mcp-k6`) and skills that let an assistant such as Claude write, validate and run k6 scripts with up-to-date k6 docs. See Grafana's guide, [Configure your AI assistant](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/). It's marked experimental, and the setup commands depend on your k6 version.

Try it: ask your assistant to *"write a k6 script for the Practice Lab reviews endpoint with a p95 threshold under 500 ms"*, then run it and check the thresholds yourself. AI writes the first draft; you own the test.

## Exercises

1. Add a check to `01-smoke.ts` that the product list's `total` is 24.
2. In `02-shopping-journey.ts`, add a step that removes one item from the cart and checks the new total.
3. Write `06-soak.ts`: 5 users for 30 minutes against a local copy. What would you watch for that a 2-minute test can't show?
4. Run `04-stress-and-spike.ts` with `SCENARIO=stress` and find the user count where p95 crosses 500 ms on your machine.
5. In `05-chaos-and-errors.ts`, add retries for 503s that honor `Retry-After`. How do the metrics change, and which ones should you report?

---

© 2026 QualityFirstQA LLC. Dhanoa Partners is a training brand of QualityFirstQA LLC. For personal learning; see LICENSE.
