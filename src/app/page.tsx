"use client";

import { useMarketData } from "@/hooks/useMarketData";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const { data, isLoading, isError, errorMessage, dataSource, refresh } = useMarketData();

  if (isError) {
    return (
      <div className="min-h-screen bg-chart-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-bear text-4xl mb-4">⚠</div>
          <h2 className="text-chart-text font-bold text-lg mb-2">
            データの取得に失敗しました
          </h2>
          <p className="text-chart-muted text-sm mb-4">
            ネットワーク接続を確認するか、ダミーデータモードに切り替えてください。
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-chart-card border border-chart-border text-chart-text text-sm hover:border-chart-border2 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-chart-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-chart-muted text-sm font-mono">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      data={data}
      isLoading={isLoading}
      dataSource={dataSource}
      apiWarning={errorMessage ?? undefined}
      onRefresh={refresh}
    />
  );
}
