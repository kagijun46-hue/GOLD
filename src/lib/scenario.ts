// ===================================================================
// XAUUSD Trading Assistant - Scenario Generation
// ===================================================================

import type {
  Scenario,
  TimeframeTrend,
  MacroScore,
  MarketData,
  TrendPattern,
} from "@/types";
import { KEY_PRICE_LEVELS } from "@/data/dummy";

// ---------------------------------------------------------------
// シナリオ生成（ルールベース）
// ---------------------------------------------------------------

/**
 * 現在の市場状況からトレードシナリオを生成する
 *
 * ルール:
 * 買いシナリオが有効:
 *   - 5080サポート付近 + 短期RSI 30以下 + マクロ追い風or中立
 *
 * 売りシナリオが有効:
 *   - 5103〜5111レジスタンス付近 + 短期下降 + DXY上昇
 *
 * 様子見シナリオが有効:
 *   - 5080〜5111レンジ + FOMC前 + マクロ拮抗
 */
export function generateScenarios(
  marketData: MarketData,
  trends: TimeframeTrend[],
  macroScore: MacroScore,
  trendPattern: TrendPattern
): Scenario[] {
  const currentPrice = marketData.xauusd.price;
  const dxy = marketData.dxy;
  const h1Trend = trends.find((t) => t.timeframe === "H1");
  const h4Trend = trends.find((t) => t.timeframe === "H4");
  const m15Trend = trends.find((t) => t.timeframe === "M15");
  const m5Trend = trends.find((t) => t.timeframe === "M5");

  const isNearSupport5080 =
    currentPrice >= KEY_PRICE_LEVELS.SUPPORT_MAIN - 20 &&
    currentPrice <= KEY_PRICE_LEVELS.SUPPORT_MAIN + 30;

  const isNearResistance5103_5111 =
    currentPrice >= KEY_PRICE_LEVELS.RESISTANCE_MID_LOW - 10 &&
    currentPrice <= KEY_PRICE_LEVELS.RESISTANCE_MID_HIGH + 15;

  const isInRange =
    currentPrice > KEY_PRICE_LEVELS.SUPPORT_MAIN &&
    currentPrice < KEY_PRICE_LEVELS.RESISTANCE_MID_LOW;

  const isAbove5160 = currentPrice > KEY_PRICE_LEVELS.RESISTANCE_HIGH;
  const isBelow5050 = currentPrice < KEY_PRICE_LEVELS.SUPPORT_LOW;

  const rsiM5 = m5Trend?.rsi ?? 50;
  const rsiM15 = m15Trend?.rsi ?? 50;
  const rsiH1 = h1Trend?.rsi ?? 50;

  const isRsiOversold = rsiM5 <= 32 || rsiM15 <= 32 || rsiH1 <= 35;
  const isDxyRising = dxy.trend === "UP" && dxy.changePercent > 0;

  // -------------------------------------------------------
  // 買いシナリオ
  // -------------------------------------------------------
  const bullConditions: string[] = [];
  let bullIsActive = false;

  bullConditions.push("5080サポート付近で反発確認");
  bullConditions.push("4時間足 or 1時間足で陽線確定");
  bullConditions.push("RSIが30以下から反転");
  bullConditions.push("DXY下落 or 地政学悪化を確認");
  bullConditions.push("5160突破で上昇加速期待");

  if (isNearSupport5080 && isRsiOversold && macroScore.net >= -2) {
    bullIsActive = true;
  }
  if (isAbove5160) {
    bullConditions.push("5160超え → 5200〜5240が次の目標");
    bullIsActive = true;
  }

  const bullScenario: Scenario = {
    type: "BULL",
    title: "買いシナリオ",
    conditions: bullConditions,
    target: "5160 → 5240",
    stopLoss: "5050割れ",
    probability:
      isNearSupport5080 && isRsiOversold
        ? "MEDIUM"
        : isAbove5160
        ? "HIGH"
        : "LOW",
    isActive: bullIsActive,
  };

  // -------------------------------------------------------
  // 売りシナリオ
  // -------------------------------------------------------
  const bearConditions: string[] = [];
  let bearIsActive = false;

  bearConditions.push("5103〜5111レジスタンスで反落確認");
  bearConditions.push("1時間足 or 15分足で陰線確定");
  bearConditions.push("DXY上昇継続を確認");
  bearConditions.push("米10年債利回り高止まり継続");

  if (isNearResistance5103_5111) {
    bearConditions.push("現在価格はレジスタンス付近 → 反落注意");
    if (isDxyRising && macroScore.net <= -1) {
      bearIsActive = true;
    }
  }
  if (isBelow5050) {
    bearConditions.push("5050割れ → 下落加速中。5000〜4995が目標。");
    bearIsActive = true;
  }

  const bearScenario: Scenario = {
    type: "BEAR",
    title: "売りシナリオ",
    conditions: bearConditions,
    target: "5064 → 5050",
    stopLoss: "5111超え",
    probability:
      isBelow5050
        ? "HIGH"
        : isNearResistance5103_5111 && isDxyRising
        ? "MEDIUM"
        : "LOW",
    isActive: bearIsActive,
  };

  // -------------------------------------------------------
  // 様子見シナリオ
  // -------------------------------------------------------
  const waitConditions: string[] = [];
  let waitIsActive = false;

  waitConditions.push("5080〜5111レンジ内で方向感なし");
  waitConditions.push("FOMC・指標発表前は無理にエントリーしない");
  waitConditions.push("マクロの追い風・逆風が拮抗");
  waitConditions.push("5080 or 5160のブレイクを待つ");

  if (isInRange || macroScore.judgment === "NEUTRAL") {
    waitIsActive = true;
    waitConditions.push("現在はレンジ内推移 → ブレイクアウト待ち");
  }

  if (trendPattern === "DAILY_UP_SHORT_DOWN" || trendPattern === "MIXED") {
    waitIsActive = true;
    waitConditions.push("日足と短期足の方向が対立 → ダマシに注意");
  }

  const waitScenario: Scenario = {
    type: "WAIT",
    title: "様子見シナリオ",
    conditions: waitConditions,
    probability: waitIsActive ? "HIGH" : "MEDIUM",
    isActive: waitIsActive,
  };

  return [bullScenario, bearScenario, waitScenario];
}
