# CLAUDE.md — AI Assistant Guide for XAUUSD Trading Assistant

## Project Overview

This is an **XAUUSD (Gold/USD) Trading Assistant** — a Next.js 14 + TypeScript web app that:
- Fetches live market data from the **Twelve Data API** (XAUUSD quotes, DXY, US 10Y yield, OHLC for 5 timeframes)
- Performs **multi-timeframe trend analysis** using EMA crossovers and RSI
- Calculates a **macro score** from 6 factors (DXY, US10Y yield, Fed rate, geopolitics, inflation, employment)
- Generates a final **BULL / BEAR / WAIT** judgment with confidence + reasoning
- Produces **entry condition checklists**, **trade scenarios**, and **alert notifications**
- Falls back gracefully to **dummy data** for offline/demo use

**Version:** 0.1.0 (MVP)
**Language:** TypeScript (strict mode)
**Primary Docs:** `README.md` (Japanese)

---

## Repository Structure

```
/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Root client page (error/loading states → Dashboard)
│   │   ├── layout.tsx            # Root layout: metadata, JetBrains Mono font, dark theme
│   │   ├── globals.css           # Base Tailwind styles
│   │   └── api/
│   │       └── market-data/
│   │           └── route.ts      # GET /api/market-data — main API route
│   ├── components/               # All UI components (client-side)
│   │   ├── Dashboard.tsx         # Top-level container, orchestrates all sections
│   │   ├── OverallJudgment.tsx   # BULL/BEAR/WAIT badge + confidence + reasoning
│   │   ├── MacroEnvironment.tsx  # 6-factor macro grid
│   │   ├── TrendTable.tsx        # 5-timeframe direction/strength/RSI table
│   │   ├── PriceLevels.tsx       # Support/resistance chart & breakout zones
│   │   ├── ScenarioCards.tsx     # Buy/sell/wait scenario cards
│   │   ├── EntryConditions.tsx   # Detailed entry checklist with R:R
│   │   └── Notifications.tsx     # Alert queue with priority badges
│   ├── lib/                      # Pure logic (no React)
│   │   ├── trend.ts              # EMA/RSI-based trend analysis, pattern classification
│   │   ├── macro.ts              # Macro score calculation (-2 to +2 per factor)
│   │   ├── summary.ts            # Final judgment assembly + summary text
│   │   ├── scenario.ts           # Trade scenario generation
│   │   ├── entrySignal.ts        # Entry condition detection + R:R calculation
│   │   ├── notification.ts       # Alert message generation (LINE/Telegram stubs)
│   │   └── api/
│   │       ├── twelvedata.ts     # TwelveDataClient class + rate-limit handling
│   │       ├── transform.ts      # API response → internal types transformation
│   │       └── indicators.ts     # Pure EMA + RSI calculations
│   ├── hooks/
│   │   └── useMarketData.ts      # Central data-fetching hook (dual: live/dummy)
│   ├── types/
│   │   └── index.ts              # ALL shared TypeScript types and enums
│   └── data/
│       └── dummy.ts              # Static fallback market data
├── .env.example                  # Environment variable template
├── next.config.js                # Next.js config (React strict mode)
├── tailwind.config.ts            # Custom color palette + JetBrains Mono font
├── tsconfig.json                 # Strict TypeScript config; path alias @/* → src/*
├── package.json                  # npm scripts + dependencies
└── README.md                     # Japanese documentation
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 18, Tailwind CSS 3.3 |
| Data Source | Twelve Data API |
| Build | Next.js built-in (no custom webpack) |
| Linting | ESLint with `eslint-config-next` |

No external charting libraries, trading libraries, or databases — all logic is implemented from scratch.

---

## Development Setup

### Prerequisites
- Node.js 18+
- A [Twelve Data API key](https://twelvedata.com/) (free plan: 8 req/min)

### Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set TWELVE_DATA_API_KEY and NEXT_PUBLIC_USE_DUMMY_DATA
npm run dev   # http://localhost:3000
```

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `TWELVE_DATA_API_KEY` | For live mode | — | Twelve Data authentication |
| `NEXT_PUBLIC_USE_DUMMY_DATA` | No | `true` | `true` = demo mode (no API calls); `false` = live |
| `NEXT_PUBLIC_REFRESH_INTERVAL` | No | `60` | Auto-refresh interval in seconds |

### npm Scripts

```bash
npm run dev    # Development server with hot reload
npm run build  # Production build (validates TypeScript + lint)
npm run start  # Serve production build
npm run lint   # ESLint check
```

---

## Data Flow

```
Browser
  └─ page.tsx
       └─ useMarketData() hook
            ├─ (dummy mode)  → DUMMY_MARKET_DATA from src/data/dummy.ts
            └─ (live mode)   → GET /api/market-data
                                  ├─ TwelveDataClient.getQuote() × 3 (XAUUSD, DXY, TNX)
                                  └─ TwelveDataClient.getTimeSeries() × 5 timeframes
                                        └─ calculateAllIndicators() (EMA20/50/200, RSI14)
                                              └─ buildMarketData() + transformTimeframeTrend()

       After data arrives (either path):
            ├─ calculateMacroScore(factors)
            ├─ classifyTrendPattern(trends)       → TrendPattern enum
            ├─ determineOverallJudgment(...)      → BULL | BEAR | WAIT
            ├─ generateScenarios()
            ├─ evaluateEntryConditions()
            ├─ generateNotifications()
            └─ buildAnalysisResult()              → AnalysisResult (unified output)

  └─ Dashboard.tsx receives AnalysisResult → distributes to 7 child components
```

---

## Key Type Definitions (`src/types/index.ts`)

All shared types live here. Key ones:

```typescript
enum TrendDirection { UP = "UP", DOWN = "DOWN", SIDEWAYS = "SIDEWAYS" }
enum OverallJudgment { BULL = "BULL", BEAR = "BEAR", WAIT = "WAIT" }
enum Timeframe { D1 = "D1", H4 = "H4", H1 = "H1", M15 = "M15", M5 = "M5" }

interface AnalysisResult {
  overallJudgment: OverallJudgment;
  confidence: number;           // 0–100
  summaryText: string;
  macroScore: MacroScore;
  timeframeTrends: TimeframeTrend[];
  trendPattern: TrendPattern;
  priceLevels: PriceLevel[];
  scenarios: Scenario[];
  entryConditions: EntryCondition[];
  notifications: NotificationCandidate[];
}
```

**Always import types from `@/types`** — never redeclare them locally.

---

## Logic Layer Conventions (`src/lib/`)

- **Pure functions only** — no side effects, no React imports
- **No database or external calls** — transformation logic only
- Use the path alias `@/lib/...` for imports
- Each file has a single responsibility (trend, macro, summary, scenario, entry, notification)

### Trend Analysis (`trend.ts`)
- `analyzeMultiTimeframeTrend(marketData, timeframeTrends)` → enriched `TimeframeTrend[]`
- `classifyTrendPattern(trends)` → one of: `ALL_UP`, `ALL_DOWN`, `DAILY_UP_SHORT_DOWN`, `DAILY_DOWN_SHORT_UP`, `MIXED`
- `getTrendBias(pattern)` → `{ direction, confidence }`

### Macro Scoring (`macro.ts`)
- Each factor scores −2 to +2: positive = gold bullish, negative = gold bearish
- `calculateMacroScore(factors)` aggregates to a `MacroScore` with `sentiment` (TAILWIND / NEUTRAL / HEADWIND)
- Strong macro sentiment (score ≥ 1.5 or ≤ −1.5) can override trend judgment

### Final Judgment (`summary.ts`)
- `determineOverallJudgment(trends, macro, market)` — decision hierarchy:
  1. Strong macro headwind → BEAR override
  2. Strong macro tailwind → BULL override
  3. Opposing higher/lower timeframe alignment → WAIT
  4. Trend bias + price position → BULL or BEAR

### Entry Conditions (`entrySignal.ts`)
- Buy requires: H4/H1 bullish + price near 5080 support + RSI ≤ 32 + macro decent (≥ 3 conditions met)
- Sell requires: H1/M15 bearish + price near 5103–5111 resistance + DXY up + macro weak (≥ 3 conditions met)
- Hard-coded price levels (5050, 5080 support; 5103, 5111, 5160 resistance) — update as market evolves

---

## API Layer Conventions (`src/lib/api/`)

- **`twelvedata.ts`** — `TwelveDataClient` class; wraps API with rate-limit handling (`Promise.allSettled` + `sleep()`)
- **`transform.ts`** — converts raw API JSON → internal types; contains `TIMEFRAME_MAP` for interval strings
- **`indicators.ts`** — pure `calculateEMA(bars, period)` and `calculateRSI(bars, period)` functions

Free plan rate limit: **8 requests/minute**. The API route staggers time-series fetches in batches with delays. Do not add more parallel API calls without adjusting the batching logic.

---

## Component Conventions (`src/components/`)

- All components are **client components** (`"use client"` directive required)
- Props come from `AnalysisResult` decomposed in `Dashboard.tsx`
- Color semantics enforced via Tailwind custom classes:
  - `bull` → green (`#22c55e`)
  - `bear` → red (`#ef4444`)
  - `wait` → orange/gold (`#f59e0b`)
- Font: **JetBrains Mono** for numerical data values (configured in `tailwind.config.ts`)
- Layout: max-width `5xl`, sticky header, card-based grid

**Do not** add state management (Redux, Zustand, etc.) — data flows from `useMarketData` hook down through props.

---

## `useMarketData` Hook (`src/hooks/useMarketData.ts`)

The single source of truth for all market data and analysis:

```typescript
const { data, isLoading, isError, errorMessage, dataSource } = useMarketData();
// dataSource: "live" | "dummy" | "partial"
```

- Reads `NEXT_PUBLIC_USE_DUMMY_DATA` to switch modes
- Auto-refreshes on `NEXT_PUBLIC_REFRESH_INTERVAL` interval
- Uses `AbortController` — clean up on unmount
- Runs the entire analysis pipeline client-side after fetching raw data

---

## Dummy Data (`src/data/dummy.ts`)

Used when `NEXT_PUBLIC_USE_DUMMY_DATA=true` or when live API fails:
- XAUUSD price ~5092, DXY 104.82, US10Y 4.58%
- D1 trend UP, H4/H1/M15/M5 DOWN (intentionally mixed for demo variety)
- Update these values periodically to reflect realistic market conditions

---

## Common Patterns & Gotchas

### Adding a New Macro Factor
1. Add the factor to `src/types/index.ts` (`MacroFactor` interface)
2. Add scoring logic in `src/lib/macro.ts`
3. Add a display card in `src/components/MacroEnvironment.tsx`
4. Update `DUMMY_MACRO_FACTORS` in `src/data/dummy.ts`

### Adding a New Timeframe
1. Add to `Timeframe` enum in `src/types/index.ts`
2. Add the interval mapping to `TIMEFRAME_MAP` in `src/lib/api/transform.ts`
3. Update `TIMEFRAME_CONFIG` in `src/app/api/market-data/route.ts`
4. Add a row to `DUMMY_TIMEFRAME_TRENDS` in `src/data/dummy.ts`

### Price Level Updates
Price levels (5050, 5080 support; 5103, 5111, 5160 resistance) are hard-coded in:
- `src/lib/entrySignal.ts` — entry condition thresholds
- `src/data/dummy.ts` — `DUMMY_PRICE_LEVELS`
- `src/lib/summary.ts` — judgment price position checks

Update all three when market structure changes significantly.

### Avoiding Rate Limit Errors
- Free Twelve Data plan: 8 req/min
- The API route uses `Promise.allSettled` + `sleep()` delays between batches
- Do not add more than 2–3 parallel time-series requests without increasing the sleep delay
- Set `NEXT_PUBLIC_USE_DUMMY_DATA=true` during development to avoid hitting limits

---

## What Doesn't Exist Yet (Planned Phases)

- **No tests** — no Jest, Vitest, or Playwright setup
- **No CI/CD** — no `.github/workflows/`
- **No database** — all data is in-memory, no persistence
- **No auth** — public-facing dashboard only
- **Notification delivery is stubbed** — LINE/Telegram functions exist in `notification.ts` but don't actually send
- **No backtesting** — planned in a future phase

---

## Git Workflow

- Primary branch: `main`
- Feature branches: use descriptive names (e.g., `feat/add-rsi-divergence`)
- Commit messages: English or Japanese, conventional commits style preferred
- No pre-commit hooks or automated checks currently configured
