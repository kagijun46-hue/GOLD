// ===================================================================
// Next.js API Route: /api/market-data
//
// サーバーサイドでTwelve Data APIを呼び出す。
// APIキーはサーバー側にのみ存在し、クライアントには漏れない。
//
// レスポンス: MarketDataApiResponse
// エラー時: ダミーデータにフォールバックして source: "dummy" を返す
// ===================================================================

import { NextResponse } from "next/server";
import { createTwelveDataClient, type TDInterval } from "@/lib/api/twelvedata";
import {
  buildMarketData,
  transformTimeframeTrend,
  TIMEFRAME_MAP,
  type MarketDataApiResponse,
} from "@/lib/api/transform";
import {
  DUMMY_MARKET_DATA,
  DUMMY_TIMEFRAME_TRENDS,
} from "@/data/dummy";
import type { Timeframe, TimeframeTrend } from "@/types";

// Next.js キャッシュ設定（60秒でrevalidate）
export const revalidate = 60;

// ---------------------------------------------------------------
// GET /api/market-data
// ---------------------------------------------------------------

export async function GET(): Promise<NextResponse<MarketDataApiResponse>> {
  const fetchedAt = new Date().toISOString();

  try {
    const client = createTwelveDataClient();

    // -------------------------------------------------------
    // Step 1: クォートデータを並行取得（3リクエスト）
    // XAU/USD, DXY, TNX（米10年債利回り）
    // -------------------------------------------------------
    const [xauusdResult, dxyResult, us10yResult] = await Promise.allSettled([
      client.getQuote("XAU/USD"),
      client.getQuote("DXY"),
      client.getQuote("TNX"), // CBOE 10-Year Treasury Note Yield Index
    ]);

    // いずれかが失敗した場合はダミーデータにフォールバック
    if (
      xauusdResult.status === "rejected" ||
      dxyResult.status === "rejected" ||
      us10yResult.status === "rejected"
    ) {
      const errorMsg = [
        xauusdResult.status === "rejected" && `XAU/USD: ${xauusdResult.reason}`,
        dxyResult.status === "rejected" && `DXY: ${dxyResult.reason}`,
        us10yResult.status === "rejected" && `TNX: ${us10yResult.reason}`,
      ]
        .filter(Boolean)
        .join(", ");

      console.error("[market-data API] Quote fetch failed:", errorMsg);

      return NextResponse.json(
        {
          marketData: { ...DUMMY_MARKET_DATA, isLive: false },
          timeframeTrends: DUMMY_TIMEFRAME_TRENDS,
          error: `クォート取得失敗: ${errorMsg}`,
          source: "dummy",
          fetchedAt,
        },
        { status: 200 } // 200で返してフロントに表示させる
      );
    }

    const marketData = buildMarketData({
      xauusdQuote: xauusdResult.value,
      dxyQuote: dxyResult.value,
      us10yQuote: us10yResult.value,
    });

    // -------------------------------------------------------
    // Step 2: 時間足OHLCデータを取得（5リクエスト）
    // 無料プランのレート制限: 8req/分 → バッチ処理で対応
    // -------------------------------------------------------
    const timeframeEntries = Object.entries(TIMEFRAME_MAP) as [
      Timeframe,
      { interval: string; label: string }
    ][];

    // 最初の4つと残り1つに分割してレート制限を回避
    const firstBatch = timeframeEntries.slice(0, 4);
    const secondBatch = timeframeEntries.slice(4);

    const timeframeTrends: TimeframeTrend[] = [];

    // バッチ1: D1, H4, H1, M15
    const firstResults = await Promise.allSettled(
      firstBatch.map(([, cfg]) =>
        client.getTimeSeries("XAU/USD", cfg.interval as TDInterval, 60)
      )
    );

    firstResults.forEach((result, i) => {
      const [tf] = firstBatch[i];
      if (result.status === "fulfilled") {
        try {
          timeframeTrends.push(transformTimeframeTrend(tf, result.value));
        } catch (e) {
          console.warn(`[market-data API] Failed to transform ${tf}:`, e);
          const fallback = DUMMY_TIMEFRAME_TRENDS.find(
            (t) => t.timeframe === tf
          );
          if (fallback) timeframeTrends.push(fallback);
        }
      } else {
        console.warn(
          `[market-data API] Time series failed for ${tf}:`,
          result.reason
        );
        const fallback = DUMMY_TIMEFRAME_TRENDS.find((t) => t.timeframe === tf);
        if (fallback) timeframeTrends.push(fallback);
      }
    });

    // バッチ2: M5（レート制限を考慮して少し待機）
    if (secondBatch.length > 0) {
      await sleep(1000); // 1秒待機

      const secondResults = await Promise.allSettled(
        secondBatch.map(([, cfg]) =>
          client.getTimeSeries("XAU/USD", cfg.interval as TDInterval, 60)
        )
      );

      secondResults.forEach((result, i) => {
        const [tf] = secondBatch[i];
        if (result.status === "fulfilled") {
          try {
            timeframeTrends.push(transformTimeframeTrend(tf, result.value));
          } catch (e) {
            console.warn(`[market-data API] Failed to transform ${tf}:`, e);
            const fallback = DUMMY_TIMEFRAME_TRENDS.find(
              (t) => t.timeframe === tf
            );
            if (fallback) timeframeTrends.push(fallback);
          }
        } else {
          const fallback = DUMMY_TIMEFRAME_TRENDS.find(
            (t) => t.timeframe === tf
          );
          if (fallback) timeframeTrends.push(fallback);
        }
      });
    }

    // 時間足の順序を保証（D1 → H4 → H1 → M15 → M5）
    const tfOrder: Timeframe[] = ["D1", "H4", "H1", "M15", "M5"];
    const sortedTrends = tfOrder
      .map((tf) => timeframeTrends.find((t) => t.timeframe === tf))
      .filter((t): t is TimeframeTrend => t !== undefined);

    // 全時間足が揃わなかった場合のフォールバック
    const finalTrends =
      sortedTrends.length >= 3 ? sortedTrends : DUMMY_TIMEFRAME_TRENDS;

    const isPartial = sortedTrends.length < 5;

    return NextResponse.json({
      marketData,
      timeframeTrends: finalTrends,
      source: isPartial ? "partial" : "live",
      fetchedAt,
    });
  } catch (error) {
    // APIキー未設定 or 予期しないエラー → ダミーデータで返す
    const errorMsg =
      error instanceof Error ? error.message : "不明なエラーが発生しました";

    console.error("[market-data API] Unexpected error:", errorMsg);

    return NextResponse.json(
      {
        marketData: { ...DUMMY_MARKET_DATA, isLive: false },
        timeframeTrends: DUMMY_TIMEFRAME_TRENDS,
        error: errorMsg,
        source: "dummy",
        fetchedAt,
      },
      { status: 200 }
    );
  }
}

// ---------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
