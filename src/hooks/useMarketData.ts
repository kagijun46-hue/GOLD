// ===================================================================
// XAUUSD Trading Assistant - useMarketData Hook
// ===================================================================
// このフックがデータ取得の唯一の窓口です。
//
// ダミーモード: NEXT_PUBLIC_USE_DUMMY_DATA=true（デフォルト）
// 実APIモード:  NEXT_PUBLIC_USE_DUMMY_DATA=false + TWELVE_DATA_API_KEY設定
//
// 実APIモードでは /api/market-data ルートを経由してサーバーサイドで
// Twelve Data APIを呼び出します。APIキーはサーバー側のみに存在します。
// ===================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import type { MarketDataApiResponse } from "@/lib/api/transform";

// ---------------------------------------------------------------
// 設定
// ---------------------------------------------------------------

/** ダミーデータを使用するかどうか（.envで制御） */
const USE_DUMMY = process.env.NEXT_PUBLIC_USE_DUMMY_DATA !== "false";

/** データ自動更新間隔（秒）*/
const REFRESH_INTERVAL_SEC = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL ?? "60",
  10
);

// ---------------------------------------------------------------
// フック戻り値の型
// ---------------------------------------------------------------

export interface UseMarketDataResult {
  data: AnalysisResult | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  dataSource: "live" | "dummy" | "partial" | null;
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
  const [dataSource, setDataSource] = useState<"live" | "dummy" | "partial" | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // AbortController を ref で管理（クリーンアップ用）
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 前回のフェッチをキャンセル
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      let marketData: MarketData;
      let timeframeTrends: TimeframeTrend[];
      let source: "live" | "dummy" | "partial" = "dummy";

      if (USE_DUMMY) {
        // ─── ダミーモード ───────────────────────────────────
        await simulateDelay(300);
        marketData = { ...DUMMY_MARKET_DATA, updatedAt: new Date().toISOString() };
        timeframeTrends = DUMMY_TIMEFRAME_TRENDS;
        source = "dummy";
      } else {
        // ─── 実APIモード（/api/market-data 経由）──────────────
        const response = await fetch("/api/market-data", {
          signal: abortRef.current.signal,
          headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
          throw new Error(`APIルートエラー: ${response.status} ${response.statusText}`);
        }

        const apiResult: MarketDataApiResponse = await response.json();

        if (apiResult.error) {
          // サーバー側でエラーが発生したがダミーデータで返ってきた場合
          console.warn("[useMarketData] API returned error with fallback:", apiResult.error);
          setErrorMessage(`データ取得エラー（ダミーデータ表示中）: ${apiResult.error}`);
        }

        marketData = apiResult.marketData;
        timeframeTrends = apiResult.timeframeTrends;
        source = apiResult.source;
      }

      // ─── 分析ロジック実行（マクロはダミー固定）──────────────
      // NOTE: マクロ要因（DXY方向感・地政学）は実データと連携済み
      //       ただしマクロ要因の文章はダミー固定。将来はAPI経由で動的化可能。
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
      setDataSource(source);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      // AbortErrorはユーザー操作によるキャンセルなので無視
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("[useMarketData] Fetch failed:", error);
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
    return () => abortRef.current?.abort();
  }, [fetchData]);

  // 自動更新
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL_SEC * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError,
    errorMessage,
    dataSource,
    refresh: fetchData,
    lastUpdated,
  };
}

// ---------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
