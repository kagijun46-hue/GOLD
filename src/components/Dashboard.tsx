"use client";

import type { AnalysisResult } from "@/types";
import OverallJudgment from "./OverallJudgment";
import MacroEnvironment from "./MacroEnvironment";
import TrendTable from "./TrendTable";
import PriceLevels from "./PriceLevels";
import ScenarioCards from "./ScenarioCards";
import EntryConditions from "./EntryConditions";
import Notifications from "./Notifications";

interface Props {
  data: AnalysisResult;
  isLoading?: boolean;
  onRefresh?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-chart-card rounded-xl border border-chart-border" />
      ))}
    </div>
  );
}

export default function Dashboard({ data, isLoading = false, onRefresh }: Props) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-chart-bg p-4">
        <div className="max-w-5xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chart-bg">
      {/* トップナビゲーション */}
      <header className="sticky top-0 z-50 bg-chart-bg/90 backdrop-blur-sm border-b border-chart-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gold-400 flex items-center justify-center">
              <span className="text-xs font-bold text-black">Au</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-chart-text font-mono">
                XAUUSD Trading Assistant
              </h1>
              <p className="text-[10px] text-chart-muted font-mono">
                ゴールド相場監視・エントリー補助
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ライブ/デモ表示 */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  data.marketData.isLive
                    ? "bg-bull animate-pulse"
                    : "bg-chart-muted"
                }`}
              />
              <span className="text-[11px] font-mono text-chart-muted">
                {data.marketData.isLive ? "LIVE" : "DEMO"}
              </span>
            </div>

            {/* 更新ボタン */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-chart-border bg-chart-card text-chart-muted hover:text-chart-text hover:border-chart-border2 transition-colors"
              >
                ↻ 更新
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* 1. 総合判定（最上位に固定表示） */}
        <OverallJudgment
          judgment={data.overallJudgment}
          reason={data.overallReason}
          summary={data.summary}
          marketData={data.marketData}
          analyzedAt={data.analyzedAt}
        />

        {/* 2. 2カラムレイアウト: マクロ環境 | 時間足トレンド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MacroEnvironment macroScore={data.macroScore} />
          <TrendTable trends={data.timeframeTrends} />
        </div>

        {/* 3. 重要価格帯 */}
        <PriceLevels
          priceLevels={data.priceLevels}
          currentPrice={data.marketData.xauusd.price}
        />

        {/* 4. 2カラム: シナリオ | エントリー条件 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScenarioCards scenarios={data.scenarios} />
          <EntryConditions entryConditions={data.entryConditions} />
        </div>

        {/* 5. 通知候補 */}
        <Notifications notifications={data.notifications} />

        {/* フッター */}
        <footer className="text-center py-4 border-t border-chart-border">
          <p className="text-[10px] text-chart-muted font-mono">
            XAUUSD Trading Assistant MVP v0.1 — ダミーデータ動作中
          </p>
          <p className="text-[10px] text-chart-muted font-mono mt-1">
            ※ このツールは情報提供のみを目的としており、投資助言ではありません。
          </p>
        </footer>
      </main>
    </div>
  );
}
