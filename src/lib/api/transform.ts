// ===================================================================
// API レスポンス → アプリ型への変換関数
// ===================================================================

import type {
  MarketData,
  TimeframeTrend,
  Timeframe,
  TrendDirection,
} from "@/types";
import type { TDQuoteResponse, TDTimeSeriesResponse } from "./twelvedata";
import {
  parseOhlcBars,
  calculateAllIndicators,
  type IndicatorResult,
} from "./indicators";

// ---------------------------------------------------------------
// XAUUSDクォート変換
// ---------------------------------------------------------------

/**
 * Twelve DataのXAUUSDクォートレスポンスをアプリ型に変換する
 */
export function transformXauusdQuote(quote: TDQuoteResponse): MarketData["xauusd"] {
  const price = parseFloat(quote.close);
  const prevClose = parseFloat(quote.previous_close);
  const change = parseFloat(quote.change);
  const changePercent = parseFloat(quote.percent_change);

  return {
    price,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: parseFloat(quote.high),
    low: parseFloat(quote.low),
    open: parseFloat(quote.open),
    timestamp: quote.datetime,
  };
}

// ---------------------------------------------------------------
// DXYクォート変換
// ---------------------------------------------------------------

/**
 * DXYのクォートをアプリ型に変換する
 */
export function transformDxyQuote(quote: TDQuoteResponse): MarketData["dxy"] {
  const value = parseFloat(quote.close);
  const change = parseFloat(quote.change);
  const changePercent = parseFloat(quote.percent_change);

  // DXYのトレンド方向：前日比で判定
  let trend: TrendDirection;
  if (changePercent > 0.1) {
    trend = "UP";
  } else if (changePercent < -0.1) {
    trend = "DOWN";
  } else {
    trend = "SIDEWAYS";
  }

  return {
    value: Math.round(value * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    trend,
  };
}

// ---------------------------------------------------------------
// 米10年債利回り変換
// ---------------------------------------------------------------

/**
 * 米10年債利回り（TNX）のクォートをアプリ型に変換する
 * TNXはパーセンテージ×10で表示されるため10で割る
 */
export function transformUs10yQuote(quote: TDQuoteResponse): MarketData["us10y"] {
  // TNX: 45.8 → 4.58%
  const rawYield = parseFloat(quote.close);
  const yieldPct = rawYield > 10 ? rawYield / 10 : rawYield; // 自動スケーリング
  const rawChange = parseFloat(quote.change);
  const change = rawChange > 1 ? rawChange / 10 : rawChange;

  let trend: TrendDirection;
  if (change > 0.02) {
    trend = "UP";
  } else if (change < -0.02) {
    trend = "DOWN";
  } else {
    trend = "SIDEWAYS";
  }

  return {
    yield: Math.round(yieldPct * 100) / 100,
    change: Math.round(change * 100) / 100,
    trend,
  };
}

// ---------------------------------------------------------------
// 時間足データ変換
// ---------------------------------------------------------------

/** アプリの時間足IDとTwelve Data設定のマッピング */
export const TIMEFRAME_MAP: Record<
  Timeframe,
  { interval: string; label: string }
> = {
  D1: { interval: "1day", label: "日足" },
  H4: { interval: "4h", label: "4時間足" },
  H1: { interval: "1h", label: "1時間足" },
  M15: { interval: "15min", label: "15分足" },
  M5: { interval: "5min", label: "5分足" },
};

/**
 * 時間足のOHLCデータとIndicatorResultからTimeframeTrendを生成する
 */
export function transformTimeframeTrend(
  timeframe: Timeframe,
  series: TDTimeSeriesResponse
): TimeframeTrend {
  const bars = parseOhlcBars(series.values);
  const indicators = calculateAllIndicators(bars);
  const label = TIMEFRAME_MAP[timeframe].label;

  const description = buildTrendDescription(
    label,
    indicators,
    bars.length
  );

  return {
    timeframe,
    direction: indicators.trend,
    strength: indicators.strength,
    description,
    ema_fast: indicators.ema_fast,
    ema_slow: indicators.ema_slow,
    rsi: indicators.rsi,
  };
}

/**
 * トレンドの説明文を生成する
 */
function buildTrendDescription(
  label: string,
  ind: IndicatorResult,
  dataCount: number
): string {
  const rsiDesc =
    ind.rsi <= 30
      ? "RSI売られすぎ"
      : ind.rsi >= 70
      ? "RSI買われすぎ"
      : `RSI${ind.rsi}`;

  const emaDiff = ind.ema_fast - ind.ema_slow;
  const emaDesc =
    emaDiff > 0
      ? `EMA20>EMA50（+${Math.abs(emaDiff).toFixed(1)}）`
      : `EMA20<EMA50（-${Math.abs(emaDiff).toFixed(1)}）`;

  const strengthDesc = {
    STRONG: "強い",
    MODERATE: "中程度の",
    WEAK: "弱い",
  }[ind.strength];

  const dirDesc = {
    UP: "上昇",
    DOWN: "下降",
    SIDEWAYS: "横ばい",
  }[ind.trend];

  return `${label}: ${strengthDesc}${dirDesc}トレンド。${emaDesc}、${rsiDesc}。（${dataCount}本分析）`;
}

// ---------------------------------------------------------------
// MarketData の組み立て
// ---------------------------------------------------------------

/**
 * 全APIレスポンスからMarketDataオブジェクトを組み立てる
 */
export function buildMarketData(params: {
  xauusdQuote: TDQuoteResponse;
  dxyQuote: TDQuoteResponse;
  us10yQuote: TDQuoteResponse;
}): MarketData {
  return {
    xauusd: transformXauusdQuote(params.xauusdQuote),
    dxy: transformDxyQuote(params.dxyQuote),
    us10y: transformUs10yQuote(params.us10yQuote),
    updatedAt: new Date().toISOString(),
    isLive: true,
  };
}

// ---------------------------------------------------------------
// API Route レスポンス型（フロントエンドとの共有型）
// ---------------------------------------------------------------

export interface MarketDataApiResponse {
  marketData: MarketData;
  timeframeTrends: TimeframeTrend[];
  error?: string;
  source: "live" | "dummy" | "partial"; // データソース種別
  fetchedAt: string;
}
