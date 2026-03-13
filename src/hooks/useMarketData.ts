// ===================================================================
// XAUUSD Trading Assistant - useMarketData Hook
// ===================================================================
// このフックがデータ取得の唯一の窓口です。
// 実APIに接続する場合はこのファイルの fetchLiveData 関数を実装してください。
// フロントエンドのコンポーネントは一切変更不要です。
// ===================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalysisResult, MarketData, TimeframeTrend } from "@/types";
import {
  DUMMY_MARKET_DATA,
  DUMMY_TIMEFRAME_TRENDS,
  DUMMY_MACRO_FACTORS,
  DUMMY_PRICE_LEVELS,
} from "@/data/dummy";
import { calculateMacroScore } from "@/lib/macro";
import { classifyTrendPattern } from "@/lib/trend";
import { generateScenarios } from "@/lib/scenario";
import { evaluateEntryConditions } from "@/lib/entrySignal";
import { generateNotifications } from "@/lib/notification";
import { buildAnalysisResult, determineOverallJudgment } from "@/lib/summary";

// ---------------------------------------------------------------
// 設定
// ---------------------------------------------------------------

/** ダミーデータを使用するかどうか（.envで制御可能） */
const USE_DUMMY = process.env.NEXT_PUBLIC_USE_DUMMY_DATA !== "false";

/** データ自動更新間隔（秒）*/
const REFRESH_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? "60",
  10
);

// ---------------------------------------------------------------
// フック戻り値の型
// ---------------------------------------------------------------

interface UseMarketDataResult {
  data: AnalysisResult | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refresh: () => void;
  lastUpdated: string | null;
}

// ---------------------------------------------------------------
// メインフック
// ---------------------------------------------------------------

export function useMarketData(): UseMarketDataResult {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      let marketData: MarketData;
      let timeframeTrends: TimeframeTrend[];

      if (USE_DUMMY) {
        // ダミーデータを使用（APIなしで動作確認可能）
        await simulateDelay(300); // リアルな読み込み感のため
        marketData = {
          ...DUMMY_MARKET_DATA,
          updatedAt: new Date().toISOString(),
        };
        timeframeTrends = DUMMY_TIMEFRAME_TRENDS;
      } else {
        // 実APIへの接続（将来実装）
        const result = await fetchLiveData();
        marketData = result.marketData;
        timeframeTrends = result.timeframeTrends;
      }

      // ===== 分析ロジックの実行 =====
      const macroScore = calculateMacroScore(DUMMY_MACRO_FACTORS);
      const trendPattern = classifyTrendPattern(timeframeTrends);

      const scenarios = generateScenarios(
        marketData,
        timeframeTrends,
        macroScore,
        trendPattern
      );

      const entryConditions = evaluateEntryConditions(
        marketData,
        timeframeTrends,
        macroScore
      );

      const { judgment, reason } = determineOverallJudgment(
        timeframeTrends,
        macroScore,
        marketData
      );

      const notifications = generateNotifications(
        judgment,
        marketData,
        timeframeTrends,
        entryConditions,
        macroScore
      );

      const analysisResult = buildAnalysisResult({
        marketData,
        trends: timeframeTrends,
        macroScore,
        priceLevels: DUMMY_PRICE_LEVELS,
        scenarios,
        entryConditions,
        notifications,
      });

      setData(analysisResult);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Market data fetch failed:", error);
      setIsError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "データ取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回フェッチ
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自動更新（インターバル）
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData, REFRESH_INTERVAL]);

  return {
    data,
    isLoading,
    isError,
    errorMessage,
    refresh: fetchData,
    lastUpdated,
  };
}

// ---------------------------------------------------------------
// 実APIデータ取得（将来実装）
// ---------------------------------------------------------------

/**
 * 実際のAPIからデータを取得する関数
 * 接続先APIに応じて以下を実装する:
 *
 * 1. Alpha Vantage: FOREX_DAILY/FOREX_INTRADAY エンドポイント
 *    https://www.alphavantage.co/documentation/
 *
 * 2. Twelve Data: /quote, /time_series エンドポイント
 *    https://twelvedata.com/docs
 *
 * 3. Yahoo Finance（非公式）: yahoofinancejs等のライブラリを使用
 *
 * 4. 自作バックエンドAPI: Next.js API Routes (src/app/api/) 経由
 *
 * @throws {Error} API接続失敗時
 */
async function fetchLiveData(): Promise<{
  marketData: MarketData;
  timeframeTrends: TimeframeTrend[];
}> {
  // TODO: 実装例
  // const response = await fetch('/api/market-data');
  // if (!response.ok) throw new Error(`API error: ${response.status}`);
  // const json = await response.json();
  // return transformApiResponse(json);

  throw new Error(
    "実APIは未実装です。.envのNEXT_PUBLIC_USE_DUMMY_DATA=trueでダミーデータを使用してください。"
  );
}

// ---------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------
// API Route のスケルトン（将来: src/app/api/market-data/route.ts）
// ---------------------------------------------------------------
//
// export async function GET() {
//   try {
//     const [xauusd, dxy, us10y] = await Promise.all([
//       fetchXauusd(),
//       fetchDxy(),
//       fetchUs10y(),
//     ]);
//
//     return Response.json({ xauusd, dxy, us10y });
//   } catch (error) {
//     return Response.json({ error: 'fetch failed' }, { status: 500 });
//   }
// }
