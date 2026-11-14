# k6 Lab — Student Handout

*A hands-on performance-testing lab. By Avneet Dhanoa (QualityFirstQA LLC).*

Work through this top to bottom. Each step has a **Do** (run something) and a **Check** (what you should see). Tick the checkpoints as you go.

**Time:** ~60 minutes. **You need:** [k6 installed](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`brew install k6` on a Mac), a terminal. Node.js 20+ is optional (editor autocomplete + typecheck only).

---

## The one idea to hold onto: performance testing is rush-hour traffic

A functional test asks *"does the road work?"* — one car, does it reach the end. A **performance** test asks *"what happens at rush hour?"* You put many cars on the road at once and watch **where it jams and how badly.**

| Traffic | k6 | In this lab |
|---|---|---|
| One car | 1 virtual user (VU) | `01-smoke.ts` |
| Rush hour building up | ramping VUs (`stages`) | `03-load.ts` |
| A sudden flood (concert lets out) | a spike scenario | `04-stress-and-spike.ts` |
| The speed limit you promise drivers | a **threshold** (pass/fail gate) | every script |
| "95% of cars got through in X minutes" | **p95 latency** | the metric you report |
| A lane randomly closing | chaos (`X-Chaos: 1`, random 503s) | `05-chaos-and-errors.ts` |

Two things a tester must internalize here:
1. **Report the p95, not the average.** The average hides the cars stuck in the jam — p95 is the experience a real user actually feels.
2. **A threshold is the pass/fail line.** Without it, a load test is just a pretty chart. With it, CI can go red when the road is too slow.

---

## Read this FIRST: be kind to the shared road

The live site is a **shared** training environment, rate-limited to **100 API requests / 10s / IP**.

- ☐ **Light scripts (01, 02, 05, 06)** are sized to stay well under it — safe on the live site.
- ☐ **Heavy scripts (03, 04)** *refuse to run* against the live site. Run them against a **local copy** (`LAB_URL=http://localhost:8788`).
- ☐ **Never** point a load test at a site you don't own or have permission to test. This is the single most important rule in the repo.

---

## Part 1 — One car (smoke)

**Do:**
```bash
k6 run scripts/01-smoke.ts
```

**Check** ☐ The run finishes and prints a summary with **checks** (✓/✗) and **thresholds** at the bottom.

**Read the summary:**
- ☐ Find `http_req_duration` and its **p95**. What was it?  _______ ms
- ☐ Find `http_req_failed` — the share of failed requests. (Even 1% is a lot at scale.)
- ☐ Find the **thresholds** block: a ✓ means the gate passed. If any threshold fails, k6 exits non-zero and CI goes red.

> **Checks vs. thresholds:** a failing *check* is just a tally — it doesn't fail the run on its own. A *threshold* is the gate. To make checks count, you add a `checks` threshold. Find both in the script.

---

## Part 2 — A real journey, with correlation

Open `scripts/02-shopping-journey.ts` and run it:
```bash
k6 run scripts/02-shopping-journey.ts
```

**Check** ☐ It passes. Now read the script for three things a realistic test needs:

- ☐ **Groups** — the journey is broken into named steps (browse → add → checkout).
- ☐ **A custom `Trend` metric** and **checks on business values** — e.g. that the `SAVE10` discount is actually applied.
- ☐ **Correlation** — a sign-in **token** pulled out of one response and reused in the next request. This is *the* skill that separates a real load script from naive replay. Find where the token is captured and where it's sent back.

☐ In one sentence: why can't you hard-code the token instead of correlating it? _______

---

## Part 3 — Push until it bends (local only)

> These need a **local** copy of the site. They refuse to run live — on purpose.

**Do:**
```bash
LAB_URL=http://localhost:8788 k6 run scripts/03-load.ts
LAB_URL=http://localhost:8788 k6 run --env SCENARIO=spike scripts/04-stress-and-spike.ts
```

**Check** ☐ Watch the p95 climb as VUs ramp up. The question a stress test answers isn't "does it pass" — it's **"at how many users does it bend?"**

☐ Note the user count where p95 crosses **500 ms** on your machine: _______

> `04` has **two scenarios in one script** — `ramping-vus` (a crowd walking in) vs `ramping-arrival-rate` (a fixed flow of requests regardless of how backed up it gets). Read both and note the difference.

---

## Part 4 — Chaos: telling expected errors from real ones

**Do:**
```bash
k6 run scripts/05-chaos-and-errors.ts
```
This sends `X-Chaos: 1`, so the site injects latency and random 503s.

**Check** ☐ The script uses custom `Rate` metrics to separate **expected** chaos errors from **real** failures. A resilient system under chaos should still meet its gates for the errors that matter.

☐ Why is "0% errors" the wrong goal for a chaos test? _______

---

## Part 5 — The HTML dashboard (steady 5-min)

The web dashboard needs a run of at least ~30 seconds; `06-steady-5min.ts` is built for it.

**Do:**
```bash
npm run steady
# equivalently:
# K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report.html k6 run scripts/06-steady-5min.ts
```

**Check** ☐ Open `report.html` — charts of the whole run. ☐ Notice the URLs are grouped by **`name` tags** (so `/products/p-1017` and `/products/p-1042` don't show as a thousand separate lines).

---

## Part 6 — Let AI write the first draft

k6 has its own MCP server (`mcp-k6`) and skills that let Claude write and run k6 scripts with up-to-date docs (see Grafana's *Configure your AI assistant* guide; it's experimental).

☐ Ask your assistant: *"write a k6 script for the Practice Lab reviews endpoint with a p95 threshold under 500 ms."* Then **run it and check the thresholds yourself.**

> The rule for the whole AI era of testing: **AI writes the first draft; you own the test.** A script that runs is not the same as a script that measures the right thing against the right gate.

---

## Part 7 — Your turn (exercises)

1. Add a **check** to `01-smoke.ts` that the product list's `total` is `24`.
2. In `02-shopping-journey.ts`, add a step that **removes one item** from the cart and checks the new total.
3. Write `06-soak.ts`: 5 users for **30 minutes** against a local copy. What would you watch for that a 2-minute test can't show? _______
4. Run `04` with `SCENARIO=stress` and find the user count where **p95 crosses 500 ms** on your machine.
5. In `05-chaos-and-errors.ts`, add retries for 503s that **honor `Retry-After`**. How do the metrics change, and which ones should you report? _______

---

## Done — what you should be able to say now

Tick each once you can explain it to the person next to you:

- ☐ Why you report **p95, not the average**.
- ☐ The difference between a **check** and a **threshold**, and which one fails CI.
- ☐ What **correlation** is and why a real load script needs it.
- ☐ The difference between **load, stress, spike, soak and chaos** — and what each one answers.
- ☐ Why heavy scripts **refuse to run against a shared site**, and the ethics rule behind it.

---

*Part of a five-repo portfolio — start at [practice-lab](https://github.com/dhanoapartners/practice-lab). Built on [Practice Lab](https://www.dhanoapartners.com). All data synthetic.*
