// ===================================================================
// XAUUSD Trading Assistant - Trend Analysis Functions
// ===================================================================

import type {
  TimeframeTrend,
  TrendDirection,
  OverallJudgment,
  Timeframe,
} from "@/types";

// ---------------------------------------------------------------
// 時間足ごとのトレンド判定（将来API接続時に差し替え）
// ---------------------------------------------------------------

/**
 * EMAのクロスと価格位置からトレンド方向を判定する
 * 現在はダミー実装。実APIではOHLCデータを受け取りEMAを計算する。
 *
 * @param emaFast - 短期EMA（例: EMA20）
 * @param emaSlow - 長期EMA（例: EMA50）
 * @param currentPrice - 現在価格
 */
export function determineTrendByEma(
  emaFast: number,
  emaSlow: number,
  currentPrice: number
): TrendDirection {
  const diff = ((emaFast - emaSlow) / emaSlow) * 100;

  if (diff > 0.1 && currentPrice > emaFast) return "UP";
  if (diff < -0.1 && currentPrice < emaFast) return "DOWN";
  return "SIDEWAYS";
}

/**
 * RSI値からトレンド方向を補完する（補助判定）
 */
export function assessTrendByRsi(rsi: number): {
  label: string;
  isOversold: boolean;
  isOverbought: boolean;
} {
  return {
    label:
      rsi <= 30
        ? "売られすぎ"
        : rsi >= 70
        ? "買われすぎ"
        : rsi < 45
        ? "やや弱い"
        : rsi > 55
        ? "やや強い"
        : "中立",
    isOversold: rsi <= 30,
    isOverbought: rsi >= 70,
  };
}

// ---------------------------------------------------------------
// 複数時間足の総合トレンド判定
// ---------------------------------------------------------------

/**
 * 複数時間足のトレンド一覧から上位・下位の方向性を判定する
 *
 * ルール:
 * - 全時間足が同じ方向 → その方向で強
 * - 日足のみ逆行 → 押し目 or 戻り候補
 * - 短期（H1以下）が逆行 → 上位に逆らっているため注意
 */
export function analyzeMultiTimeframeTrend(trends: TimeframeTrend[]): {
  higherTF: TrendDirection; // 上位時間足（日足・4H）の方向
  lowerTF: TrendDirection;  // 下位時間足（1H・15M・5M）の方向
  alignment: "ALIGNED" | "MIXED" | "OPPOSED";
  summary: string;
} {
  const higherTFs: Timeframe[] = ["D1", "H4"];
  const lowerTFs: Timeframe[] = ["H1", "M15", "M5"];

  const higherTrends = trends.filter((t) => higherTFs.includes(t.timeframe));
  const lowerTrends = trends.filter((t) => lowerTFs.includes(t.timeframe));

  const higherTF = getMajorityDirection(higherTrends);
  const lowerTF = getMajorityDirection(lowerTrends);

  let alignment: "ALIGNED" | "MIXED" | "OPPOSED";
  let summary: string;

  if (higherTF === lowerTF) {
    alignment = "ALIGNED";
    summary =
      higherTF === "UP"
        ? "全時間足が上昇方向で整合。上昇優位。"
        : higherTF === "DOWN"
        ? "全時間足が下降方向で整合。下降優位。"
        : "全時間足が横ばい。レンジ環境。";
  } else if (
    (higherTF === "UP" && lowerTF === "DOWN") ||
    (higherTF === "DOWN" && lowerTF === "UP")
  ) {
    alignment = "OPPOSED";
    summary =
      higherTF === "UP" && lowerTF === "DOWN"
        ? "日足・4H上昇に対して短期は下降。押し目買い候補かつ反転確認必要。"
        : "日足・4H下降に対して短期は上昇。戻り売り候補かつ反転確認必要。";
  } else {
    alignment = "MIXED";
    summary = "時間足間でトレンドが混在。方向感が出るまで様子見推奨。";
  }

  return { higherTF, lowerTF, alignment, summary };
}

/**
 * 時間足リストから多数決で方向を決める
 */
function getMajorityDirection(trends: TimeframeTrend[]): TrendDirection {
  if (trends.length === 0) return "SIDEWAYS";

  const counts: Record<TrendDirection, number> = {
    UP: 0,
    DOWN: 0,
    SIDEWAYS: 0,
  };

  trends.forEach((t) => {
    counts[t.direction]++;
  });

  if (counts.UP > counts.DOWN && counts.UP > counts.SIDEWAYS) return "UP";
  if (counts.DOWN > counts.UP && counts.DOWN > counts.SIDEWAYS) return "DOWN";
  return "SIDEWAYS";
}

// ---------------------------------------------------------------
// 現在価格が特定の価格帯に近いか判定
// ---------------------------------------------------------------

/**
 * 現在価格がターゲット価格のrange%以内かチェック
 */
export function isPriceNear(
  currentPrice: number,
  targetPrice: number,
  rangePercent = 0.2
): boolean {
  const diff = Math.abs(currentPrice - targetPrice);
  const threshold = (targetPrice * rangePercent) / 100;
  return diff <= threshold;
}

/**
 * 現在価格がレンジ内かチェック
 */
export function isPriceInRange(
  currentPrice: number,
  min: number,
  max: number
): boolean {
  return currentPrice >= min && currentPrice <= max;
}

// ---------------------------------------------------------------
// 日足トレンドと短期トレンドの組み合わせパターン
// ---------------------------------------------------------------

export type TrendPattern =
  | "DAILY_UP_SHORT_DOWN"    // 日足上・短期下（押し目候補）
  | "DAILY_DOWN_SHORT_UP"    // 日足下・短期上（戻り売り候補）
  | "ALL_UP"                 // 全足上昇（強気）
  | "ALL_DOWN"               // 全足下降（弱気）
  | "MIXED"                  // 混在（様子見）

/**
 * トレンドパターンを判定して総合判断に使用する文字列を返す
 */
export function classifyTrendPattern(
  trends: TimeframeTrend[]
): TrendPattern {
  const d1 = trends.find((t) => t.timeframe === "D1");
  const h4 = trends.find((t) => t.timeframe === "H4");
  const h1 = trends.find((t) => t.timeframe === "H1");
  const m15 = trends.find((t) => t.timeframe === "M15");

  if (!d1 || !h4 || !h1) return "MIXED";

  const shortTermDown =
    h4.direction === "DOWN" &&
    h1.direction === "DOWN" &&
    (m15?.direction === "DOWN" || !m15);

  const shortTermUp =
    h4.direction === "UP" &&
    h1.direction === "UP" &&
    (m15?.direction === "UP" || !m15);

  if (d1.direction === "UP" && shortTermDown) return "DAILY_UP_SHORT_DOWN";
  if (d1.direction === "DOWN" && shortTermUp) return "DAILY_DOWN_SHORT_UP";
  if (d1.direction === "UP" && shortTermUp) return "ALL_UP";
  if (d1.direction === "DOWN" && shortTermDown) return "ALL_DOWN";

  return "MIXED";
}

/**
 * トレンドパターンからOverallJudgmentの傾きを返す
 * （マクロスコアと組み合わせて最終判断を出す）
 */
export function getTrendBias(
  pattern: TrendPattern
): { bias: OverallJudgment; confidence: number } {
  switch (pattern) {
    case "ALL_UP":
      return { bias: "BULL", confidence: 0.8 };
    case "DAILY_UP_SHORT_DOWN":
      return { bias: "WAIT", confidence: 0.5 }; // 押し目候補だが確認待ち
    case "ALL_DOWN":
      return { bias: "BEAR", confidence: 0.8 };
    case "DAILY_DOWN_SHORT_UP":
      return { bias: "WAIT", confidence: 0.5 }; // 戻り売り候補だが確認待ち
    case "MIXED":
    default:
      return { bias: "WAIT", confidence: 0.3 };
  }
}
