// ===================================================================
// テクニカル指標の計算関数
// OHLCデータから EMA / RSI / ATR を計算する純粋関数群
// ===================================================================

import type { TDTimeSeriesValue } from "./twelvedata";

// ---------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------

export interface OHLCBar {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface IndicatorResult {
  ema_fast: number;    // EMA20
  ema_slow: number;    // EMA50
  rsi: number;         // RSI14
  atr: number;         // ATR14（ストップロス計算用）
  latestClose: number;
  latestHigh: number;
  latestLow: number;
  trend: "UP" | "DOWN" | "SIDEWAYS";
  strength: "STRONG" | "MODERATE" | "WEAK";
}

// ---------------------------------------------------------------
// データ変換
// ---------------------------------------------------------------

/**
 * Twelve DataのOHLCレスポンスを数値型に変換する
 * Twelve Data は全フィールドを文字列で返すため変換が必要
 */
export function parseOhlcBars(values: TDTimeSeriesValue[]): OHLCBar[] {
  // Twelve Dataは新しい順（降順）で返すため、古い順（昇順）に並べ替え
  return [...values]
    .reverse()
    .map((v) => ({
      datetime: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .filter(
      (b) =>
        !isNaN(b.open) &&
        !isNaN(b.high) &&
        !isNaN(b.low) &&
        !isNaN(b.close)
    );
}

// ---------------------------------------------------------------
// EMA（指数移動平均）
// ---------------------------------------------------------------

/**
 * EMAを計算する
 * @param closes - 終値の配列（古い順）
 * @param period - 期間
 * @returns EMA値（最新）
 */
export function calculateEma(closes: number[], period: number): number {
  if (closes.length < period) {
    // データ不足の場合は単純平均を返す
    const avg = closes.reduce((s, c) => s + c, 0) / closes.length;
    return avg;
  }

  const k = 2 / (period + 1); // 平滑化係数

  // 最初のEMAはSMA（単純平均）で初期化
  let ema = closes.slice(0, period).reduce((s, c) => s + c, 0) / period;

  // EMAを更新
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

// ---------------------------------------------------------------
// RSI（相対力指数）
// ---------------------------------------------------------------

/**
 * RSI14を計算する
 * Wilder's Smoothing Method（修正移動平均）を使用
 * @param closes - 終値の配列（古い順）
 * @param period - 期間（通常14）
 * @returns RSI値 0〜100
 */
export function calculateRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) {
    return 50; // データ不足時はニュートラル値を返す
  }

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // 初期の平均利得・損失（SMAで初期化）
  let avgGain =
    changes
      .slice(0, period)
      .filter((c) => c > 0)
      .reduce((s, c) => s + c, 0) / period;

  let avgLoss =
    changes
      .slice(0, period)
      .filter((c) => c < 0)
      .map((c) => Math.abs(c))
      .reduce((s, c) => s + c, 0) / period;

  // Wilder's smoothingで更新
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.round(rsi * 10) / 10; // 小数第1位まで
}

// ---------------------------------------------------------------
// ATR（Average True Range）
// ---------------------------------------------------------------

/**
 * ATR14を計算する（ストップロスの動的計算に使用）
 * @param bars - OHLCバーの配列（古い順）
 * @param period - 期間（通常14）
 */
export function calculateAtr(bars: OHLCBar[], period = 14): number {
  if (bars.length < period + 1) {
    // データ不足: 最新バーのHigh-Lowで代用
    const last = bars[bars.length - 1];
    return last ? last.high - last.low : 0;
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // 初期ATRはSMA
  let atr =
    trueRanges.slice(0, period).reduce((s, tr) => s + tr, 0) / period;

  // Wilder's smoothingで更新
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return Math.round(atr * 100) / 100;
}

// ---------------------------------------------------------------
// トレンド強度の判定
// ---------------------------------------------------------------

/**
 * EMAのクロスと価格位置からトレンド方向と強度を判定する
 */
export function determineTrend(
  closes: number[],
  emaFast: number,
  emaSlow: number,
  rsi: number
): { trend: "UP" | "DOWN" | "SIDEWAYS"; strength: "STRONG" | "MODERATE" | "WEAK" } {
  const latestClose = closes[closes.length - 1];
  const emaDiff = ((emaFast - emaSlow) / emaSlow) * 100;

  let trend: "UP" | "DOWN" | "SIDEWAYS";
  let strength: "STRONG" | "MODERATE" | "WEAK";

  if (emaDiff > 0.3 && latestClose > emaFast) {
    trend = "UP";
    strength = emaDiff > 1.0 && rsi > 55 ? "STRONG" : emaDiff > 0.5 ? "MODERATE" : "WEAK";
  } else if (emaDiff < -0.3 && latestClose < emaFast) {
    trend = "DOWN";
    strength = emaDiff < -1.0 && rsi < 45 ? "STRONG" : emaDiff < -0.5 ? "MODERATE" : "WEAK";
  } else {
    trend = "SIDEWAYS";
    strength = "WEAK";
  }

  return { trend, strength };
}

// ---------------------------------------------------------------
// 全指標を一括計算する
// ---------------------------------------------------------------

/**
 * OHLCバー列から全テクニカル指標を計算して返す
 */
export function calculateAllIndicators(bars: OHLCBar[]): IndicatorResult {
  if (bars.length < 3) {
    // 最低限のデータしかない場合のフォールバック
    const last = bars[bars.length - 1] ?? { close: 0, high: 0, low: 0 };
    return {
      ema_fast: last.close,
      ema_slow: last.close,
      rsi: 50,
      atr: 0,
      latestClose: last.close,
      latestHigh: last.high,
      latestLow: last.low,
      trend: "SIDEWAYS",
      strength: "WEAK",
    };
  }

  const closes = bars.map((b) => b.close);
  const ema_fast = calculateEma(closes, 20);
  const ema_slow = calculateEma(closes, 50);
  const rsi = calculateRsi(closes, 14);
  const atr = calculateAtr(bars, 14);

  const latest = bars[bars.length - 1];
  const { trend, strength } = determineTrend(closes, ema_fast, ema_slow, rsi);

  return {
    ema_fast: Math.round(ema_fast * 100) / 100,
    ema_slow: Math.round(ema_slow * 100) / 100,
    rsi,
    atr,
    latestClose: latest.close,
    latestHigh: latest.high,
    latestLow: latest.low,
    trend,
    strength,
  };
}
