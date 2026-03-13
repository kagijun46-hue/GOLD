// ===================================================================
// XAUUSD Trading Assistant - Macro Score Calculation
// ===================================================================

import type {
  MacroFactor,
  MacroScore,
  MacroSentiment,
  DxyData,
  Us10yData,
} from "@/types";
import { DUMMY_MACRO_FACTORS } from "@/data/dummy";

// ---------------------------------------------------------------
// マクロスコア計算
// ---------------------------------------------------------------

/**
 * マクロ要因リストから総合スコアを計算する
 *
 * スコア体系:
 * +2 = 強い追い風（例: 地政学リスク急上昇）
 * +1 = 追い風（例: 雇用悪化）
 *  0 = 中立
 * -1 = 逆風（例: FRB利下げ期待後退）
 * -2 = 強い逆風（例: DXY強、利回り高）
 *
 * net = tailwind_total - headwind_total
 * net >= 2  → TAILWIND（追い風優勢）
 * net <= -2 → HEADWIND（逆風優勢）
 * -1 <= net <= 1 → NEUTRAL（拮抗・様子見）
 */
export function calculateMacroScore(factors: MacroFactor[]): MacroScore {
  let tailwind = 0;
  let headwind = 0;

  factors.forEach((f) => {
    if (f.score > 0) {
      tailwind += f.score;
    } else if (f.score < 0) {
      headwind += Math.abs(f.score);
    }
  });

  const net = tailwind - headwind;

  let judgment: MacroSentiment;
  if (net >= 2) {
    judgment = "TAILWIND";
  } else if (net <= -2) {
    judgment = "HEADWIND";
  } else {
    judgment = "NEUTRAL";
  }

  return {
    tailwind,
    headwind,
    net,
    judgment,
    factors,
  };
}

// ---------------------------------------------------------------
// 実APIデータからマクロ要因を動的に生成（将来実装）
// ---------------------------------------------------------------

/**
 * DXYのデータからDXY要因スコアを算出する
 * 閾値ベースのルール判定
 */
export function scoreDxy(dxy: DxyData): MacroFactor {
  let score: number;
  let description: string;

  if (dxy.value >= 105 || dxy.changePercent >= 0.5) {
    score = -2;
    description = "ドル指数が強く上昇 → ゴールドに強い逆風";
  } else if (dxy.trend === "UP" && dxy.value >= 103) {
    score = -1;
    description = "ドル指数が上昇傾向 → ゴールドに逆風";
  } else if (dxy.trend === "DOWN" && dxy.value <= 101) {
    score = 2;
    description = "ドル指数が下落 → ゴールドに強い追い風";
  } else if (dxy.trend === "DOWN") {
    score = 1;
    description = "ドル指数が下落傾向 → ゴールドにやや追い風";
  } else {
    score = 0;
    description = "ドル指数が横ばい → 中立";
  }

  return {
    id: "DXY",
    name: "DXY（ドル指数）",
    value: `${dxy.value.toFixed(2)} (${dxy.changePercent >= 0 ? "+" : ""}${dxy.changePercent.toFixed(2)}%)`,
    sentiment: score > 0 ? "TAILWIND" : score < 0 ? "HEADWIND" : "NEUTRAL",
    score,
    description,
  };
}

/**
 * 米10年債利回りからスコアを算出する
 */
export function scoreUs10y(us10y: Us10yData): MacroFactor {
  let score: number;
  let description: string;

  if (us10y.yield >= 4.8 || us10y.trend === "UP") {
    score = us10y.yield >= 5.0 ? -2 : -1;
    description =
      us10y.yield >= 5.0
        ? "利回り5%超え → ゴールドに強い逆風"
        : "利回り上昇 → ゴールドに逆風";
  } else if (us10y.yield <= 4.0 || us10y.trend === "DOWN") {
    score = us10y.yield <= 3.5 ? 2 : 1;
    description =
      us10y.yield <= 3.5
        ? "利回り急低下 → ゴールドに強い追い風"
        : "利回り低下傾向 → ゴールドにやや追い風";
  } else {
    score = 0;
    description = "利回り安定 → 中立";
  }

  return {
    id: "US10Y",
    name: "米10年債利回り",
    value: `${us10y.yield.toFixed(2)}% (${us10y.change >= 0 ? "+" : ""}${us10y.change.toFixed(2)}%)`,
    sentiment: score > 0 ? "TAILWIND" : score < 0 ? "HEADWIND" : "NEUTRAL",
    score,
    description,
  };
}

// ---------------------------------------------------------------
// マクロ状況のテキスト要約を生成
// ---------------------------------------------------------------

/**
 * マクロスコアの結果から人間が読める要約を生成する
 */
export function generateMacroSummary(macroScore: MacroScore): string {
  const { net, tailwind, headwind, judgment } = macroScore;

  const dxy = macroScore.factors.find((f) => f.id === "DXY");
  const us10y = macroScore.factors.find((f) => f.id === "US10Y");
  const geo = macroScore.factors.find((f) => f.id === "GEOPOLITICS");

  const parts: string[] = [];

  if (judgment === "HEADWIND") {
    parts.push(`マクロ環境はゴールドに逆風優勢（逆風${headwind} vs 追い風${tailwind}）。`);
    if (dxy && dxy.score <= -2) parts.push("ドル高が最大の重しとなっている。");
    if (us10y && us10y.score <= -1) parts.push("利回り上昇も上値を抑制。");
  } else if (judgment === "TAILWIND") {
    parts.push(`マクロ環境はゴールドに追い風優勢（追い風${tailwind} vs 逆風${headwind}）。`);
    if (geo && geo.score >= 2) parts.push("地政学リスクが主要な押し上げ要因。");
  } else {
    parts.push(
      `マクロ環境は追い風と逆風が拮抗（追い風${tailwind} vs 逆風${headwind}、net=${net}）。`
    );
    if (geo && geo.score >= 1 && dxy && dxy.score <= -1) {
      parts.push("地政学追い風とドル高逆風が相殺している。");
    }
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------
// デフォルトのマクロスコア（ダミーデータ用）
// ---------------------------------------------------------------

export function getDefaultMacroScore(): MacroScore {
  return calculateMacroScore(DUMMY_MACRO_FACTORS);
}
