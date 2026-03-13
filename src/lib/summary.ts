// ===================================================================
// XAUUSD Trading Assistant - Summary Generation
// ===================================================================

import type {
  OverallJudgment,
  TimeframeTrend,
  MacroScore,
  MarketData,
  AnalysisResult,
  Scenario,
  EntryCondition,
  NotificationCandidate,
} from "@/types";
import {
  analyzeMultiTimeframeTrend,
  classifyTrendPattern,
  getTrendBias,
} from "./trend";
import { generateMacroSummary } from "./macro";
import { KEY_PRICE_LEVELS } from "@/data/dummy";

// ---------------------------------------------------------------
// 総合判定（Overall Judgment）生成
// ---------------------------------------------------------------

/**
 * トレンド + マクロスコアを組み合わせて最終的な総合判定を決定する
 *
 * 判定ロジック:
 * 1. まずトレンドパターンからバイアスを取得
 * 2. マクロスコアで重み付け
 * 3. 境界値（拮抗）では WAIT を優先
 *
 * @returns OverallJudgment ('BULL' | 'BEAR' | 'WAIT')
 */
export function determineOverallJudgment(
  trends: TimeframeTrend[],
  macroScore: MacroScore,
  marketData: MarketData
): { judgment: OverallJudgment; reason: string; confidence: number } {
  const price = marketData.xauusd.price;
  const pattern = classifyTrendPattern(trends);
  const { bias, confidence } = getTrendBias(pattern);
  const { alignment } = analyzeMultiTimeframeTrend(trends);

  let judgment: OverallJudgment = bias;
  const reasons: string[] = [];

  // --- マクロスコアによる補正 ---
  if (macroScore.judgment === "HEADWIND" && macroScore.net <= -3) {
    // 強い逆風 → BULLでもWAITに落とす
    if (judgment === "BULL") {
      judgment = "WAIT";
      reasons.push("マクロ逆風が強いため買いシグナルも様子見を優先。");
    } else if (judgment === "WAIT") {
      judgment = "BEAR";
      reasons.push("マクロ逆風優勢 + 様子見 → 売り優勢寄りの様子見。");
    }
  } else if (macroScore.judgment === "TAILWIND" && macroScore.net >= 3) {
    // 強い追い風 → BEARでもWAITに引き上げる
    if (judgment === "BEAR") {
      judgment = "WAIT";
      reasons.push("地政学リスク等追い風が強いため売りシグナルも様子見を優先。");
    }
  }

  // --- 時間足の整合性チェック ---
  if (alignment === "OPPOSED") {
    // 上位と下位が反対方向 → 基本は様子見
    judgment = "WAIT";
    reasons.push("上位・下位時間足の方向が対立。反転確認まで様子見。");
  }

  // --- 価格位置による補正 ---
  if (
    price > KEY_PRICE_LEVELS.RESISTANCE_HIGH &&
    macroScore.net >= 0
  ) {
    judgment = "BULL";
    reasons.push(`5160超え！上昇加速シグナル。`);
  } else if (
    price < KEY_PRICE_LEVELS.SUPPORT_LOW &&
    macroScore.net <= 0
  ) {
    judgment = "BEAR";
    reasons.push(`5050割れ！下落加速シグナル。`);
  }

  // --- レンジ内 → 様子見強化 ---
  if (
    price >= KEY_PRICE_LEVELS.SUPPORT_MAIN &&
    price <= KEY_PRICE_LEVELS.RESISTANCE_MID_LOW
  ) {
    if (judgment !== "BULL" && judgment !== "BEAR") {
      judgment = "WAIT";
      reasons.push(
        `5080〜5103のレンジ内推移。ブレイクアウト方向を確認してからエントリー。`
      );
    }
  }

  // --- デフォルト理由 ---
  if (reasons.length === 0) {
    switch (judgment) {
      case "BULL":
        reasons.push("上位時間足上昇 + マクロ追い風 → 買い優勢。");
        break;
      case "BEAR":
        reasons.push("短期時間足下降 + マクロ逆風 → 売り優勢。");
        break;
      case "WAIT":
      default:
        reasons.push(
          "日足上昇・短期下降の対立と、マクロの逆風・地政学追い風の相殺により様子見。"
        );
    }
  }

  const finalConfidence = alignment === "OPPOSED" ? 0.4 : confidence;

  return {
    judgment,
    reason: reasons.join(" "),
    confidence: finalConfidence,
  };
}

// ---------------------------------------------------------------
// サマリーテキスト生成
// ---------------------------------------------------------------

/**
 * 全分析結果から1〜3行のサマリーテキストを生成する
 */
export function generateSummaryText(
  judgment: OverallJudgment,
  trends: TimeframeTrend[],
  macroScore: MacroScore,
  marketData: MarketData
): string {
  const price = marketData.xauusd.price;
  const macroSummary = generateMacroSummary(macroScore);
  const { summary: trendSummary } = analyzeMultiTimeframeTrend(trends);

  const judgmentText =
    judgment === "BULL"
      ? "【買い優勢】"
      : judgment === "BEAR"
      ? "【売り優勢】"
      : "【様子見】";

  const priceNote =
    price < KEY_PRICE_LEVELS.SUPPORT_MAIN + 10
      ? `現在価格${price.toFixed(2)}は5080サポート付近。反発シグナルを待つ段階。`
      : price > KEY_PRICE_LEVELS.RESISTANCE_MID_HIGH - 10
      ? `現在価格${price.toFixed(2)}は5103〜5111レジスタンス付近。反落確認で売り目線。`
      : `現在価格${price.toFixed(2)}は5080〜5103のレンジ内。ブレイク方向待ち。`;

  return `${judgmentText} ${trendSummary} ${macroSummary} ${priceNote}`;
}

// ---------------------------------------------------------------
// 分析結果の組み立て（統合関数）
// ---------------------------------------------------------------

/**
 * 全ての分析結果を AnalysisResult 型に組み立てる
 */
export function buildAnalysisResult(params: {
  marketData: MarketData;
  trends: TimeframeTrend[];
  macroScore: MacroScore;
  priceLevels: AnalysisResult["priceLevels"];
  scenarios: Scenario[];
  entryConditions: EntryCondition[];
  notifications: NotificationCandidate[];
}): AnalysisResult {
  const {
    marketData,
    trends,
    macroScore,
    priceLevels,
    scenarios,
    entryConditions,
    notifications,
  } = params;

  const { judgment, reason } = determineOverallJudgment(
    trends,
    macroScore,
    marketData
  );

  const summary = generateSummaryText(judgment, trends, macroScore, marketData);

  return {
    overallJudgment: judgment,
    overallReason: reason,
    marketData,
    macroScore,
    timeframeTrends: trends,
    priceLevels,
    scenarios,
    entryConditions,
    notifications,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
