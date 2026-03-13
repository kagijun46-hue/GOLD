// ===================================================================
// XAUUSD Trading Assistant - Entry Signal Detection
// ===================================================================

import type {
  EntryCondition,
  TimeframeTrend,
  MacroScore,
  MarketData,
} from "@/types";
import { KEY_PRICE_LEVELS } from "@/data/dummy";
import { isPriceNear, isPriceInRange } from "./trend";

// ---------------------------------------------------------------
// エントリー条件判定（ルールベース）
// ---------------------------------------------------------------

/**
 * 現在の相場状況からエントリー条件を評価する
 *
 * 買いエントリー条件（全て揃えば isTriggered = true）:
 *   1. 4H or 1H で陽線確定（今回はトレンド方向で代用）
 *   2. 5080付近で反発
 *   3. RSI 30以下から反転
 *   4. ストップ: 5050割れ
 *   5. ターゲット: 5160 → 5240
 *
 * 売りエントリー条件（全て揃えば isTriggered = true）:
 *   1. 1H or 15M で陰線確定（今回はトレンド方向で代用）
 *   2. 5103付近で反落
 *   3. DXY上昇確認
 *   4. ストップ: 5111超え
 *   5. ターゲット: 5064 → 5050
 */
export function evaluateEntryConditions(
  marketData: MarketData,
  trends: TimeframeTrend[],
  macroScore: MacroScore
): EntryCondition[] {
  const price = marketData.xauusd.price;
  const dxy = marketData.dxy;

  const h4 = trends.find((t) => t.timeframe === "H4");
  const h1 = trends.find((t) => t.timeframe === "H1");
  const m15 = trends.find((t) => t.timeframe === "M15");
  const m5 = trends.find((t) => t.timeframe === "M5");

  // -------------------------------------------------------
  // 買いエントリー判定
  // -------------------------------------------------------
  const buyChecks = {
    nearSupport5080: isPriceNear(price, KEY_PRICE_LEVELS.SUPPORT_MAIN, 0.3),
    rsiOversold: (m5?.rsi ?? 50) <= 32 || (h1?.rsi ?? 50) <= 35,
    bullishCandle:
      h4?.direction === "UP" || h1?.direction === "UP",
    macroNotExtreme: macroScore.net >= -3,
  };

  const buyTriggeredCount = Object.values(buyChecks).filter(Boolean).length;
  const buyIsTriggered = buyTriggeredCount >= 3;

  // リスクリワード計算（買い）
  // ターゲット: 5160, ストップ: 5050
  const buyRisk = price - KEY_PRICE_LEVELS.SUPPORT_LOW;
  const buyReward = KEY_PRICE_LEVELS.RESISTANCE_HIGH - price;
  const buyRR =
    buyRisk > 0 ? (buyReward / buyRisk).toFixed(1) : "計算不可";

  const buyConditions: string[] = [
    `4時間足 or 1時間足で陽線確定 ${buyChecks.bullishCandle ? "✓" : "（未確認）"}`,
    `5080付近での反発 ${buyChecks.nearSupport5080 ? `✓（現在 ${price.toFixed(2)}）` : `（現在 ${price.toFixed(2)}、まだ距離あり）`}`,
    `RSIが30以下から反転 ${buyChecks.rsiOversold ? "✓（売られすぎ圏）" : "（まだ中立圏）"}`,
    `マクロが極端な逆風でない ${buyChecks.macroNotExtreme ? "✓" : "（マクロ逆風強い）"}`,
    "5050割れでストップロス確定",
  ];

  const buyEntry: EntryCondition = {
    id: "BUY_5080",
    side: "BUY",
    title: "5080反発買い",
    conditions: buyConditions,
    target: `5160（第1目標） → 5240（第2目標）`,
    stopLoss: `5050割れ（リスク約${buyRisk.toFixed(0)}ドル）`,
    riskReward: `RR = 1:${buyRR}`,
    isTriggered: buyIsTriggered,
  };

  // -------------------------------------------------------
  // 売りエントリー判定
  // -------------------------------------------------------
  const sellChecks = {
    nearResistance5103: isPriceInRange(
      price,
      KEY_PRICE_LEVELS.RESISTANCE_MID_LOW - 5,
      KEY_PRICE_LEVELS.RESISTANCE_MID_HIGH + 10
    ),
    dxyRising: dxy.trend === "UP" && dxy.changePercent >= 0.1,
    bearishCandle:
      h1?.direction === "DOWN" || m15?.direction === "DOWN",
    macroHeadwind: macroScore.net <= -1,
  };

  const sellTriggeredCount = Object.values(sellChecks).filter(Boolean).length;
  const sellIsTriggered = sellTriggeredCount >= 3;

  // リスクリワード計算（売り）
  // ターゲット: 5064, ストップ: 5111
  const sellRisk = KEY_PRICE_LEVELS.RESISTANCE_MID_HIGH - price;
  const sellReward = price - 5064;
  const sellRR =
    sellRisk > 0 ? (sellReward / sellRisk).toFixed(1) : "計算不可";

  const sellConditions: string[] = [
    `1時間足 or 15分足で陰線確定 ${sellChecks.bearishCandle ? "✓" : "（未確認）"}`,
    `5103〜5111付近での反落 ${sellChecks.nearResistance5103 ? `✓（現在 ${price.toFixed(2)}）` : `（現在 ${price.toFixed(2)}）`}`,
    `DXY上昇継続確認 ${sellChecks.dxyRising ? "✓（DXY上昇中）" : "（DXY未確認）"}`,
    `マクロ逆風環境 ${sellChecks.macroHeadwind ? "✓（逆風優勢）" : "（マクロ確認）"}`,
    "5111超えでストップロス確定",
  ];

  const sellEntry: EntryCondition = {
    id: "SELL_5103",
    side: "SELL",
    title: "5103反落売り",
    conditions: sellConditions,
    target: `5064（第1目標） → 5050（第2目標）`,
    stopLoss: `5111超え（リスク約${Math.abs(sellRisk).toFixed(0)}ドル）`,
    riskReward: `RR = 1:${sellRR}`,
    isTriggered: sellIsTriggered,
  };

  return [buyEntry, sellEntry];
}

// ---------------------------------------------------------------
// 追加: ブレイクアウト条件判定
// ---------------------------------------------------------------

export interface BreakoutAlert {
  direction: "UP" | "DOWN";
  level: number;
  message: string;
  isTriggered: boolean;
}

/**
 * ブレイクアウト（価格帯突破）のアラート条件を判定する
 */
export function detectBreakoutAlerts(price: number): BreakoutAlert[] {
  const alerts: BreakoutAlert[] = [];

  // 上抜けブレイクアウト: 5160超え
  alerts.push({
    direction: "UP",
    level: KEY_PRICE_LEVELS.RESISTANCE_HIGH,
    message: `5160超え！上昇加速シグナル。次の目標 5200〜5240。`,
    isTriggered: price > KEY_PRICE_LEVELS.RESISTANCE_HIGH,
  });

  // 下抜けブレイクアウト: 5050割れ
  alerts.push({
    direction: "DOWN",
    level: KEY_PRICE_LEVELS.SUPPORT_LOW,
    message: `5050割れ！下落加速シグナル。次の目標 5000〜4995。`,
    isTriggered: price < KEY_PRICE_LEVELS.SUPPORT_LOW,
  });

  return alerts;
}
