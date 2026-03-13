"use client";

import type { OverallJudgment as OverallJudgmentType, MarketData } from "@/types";

interface Props {
  judgment: OverallJudgmentType;
  reason: string;
  summary: string;
  marketData: MarketData;
  analyzedAt: string;
}

const judgmentConfig = {
  BULL: {
    label: "買い優勢",
    labelEn: "BULLISH",
    bg: "bg-bull-bg",
    border: "border-bull-border",
    text: "text-bull",
    badge: "bg-bull/20 text-bull border border-bull-border",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    icon: "▲",
  },
  BEAR: {
    label: "売り優勢",
    labelEn: "BEARISH",
    bg: "bg-bear-bg",
    border: "border-bear-border",
    text: "text-bear",
    badge: "bg-bear/20 text-bear border border-bear-border",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    icon: "▼",
  },
  WAIT: {
    label: "様子見",
    labelEn: "NEUTRAL",
    bg: "bg-wait-bg",
    border: "border-wait-border",
    text: "text-wait",
    badge: "bg-wait/20 text-wait border border-wait-border",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    icon: "◆",
  },
};

export default function OverallJudgment({
  judgment,
  reason,
  summary,
  marketData,
  analyzedAt,
}: Props) {
  const config = judgmentConfig[judgment];
  const { xauusd } = marketData;
  const isPositive = xauusd.change >= 0;

  const formattedTime = new Date(analyzedAt).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} ${config.glow} p-5 mb-4`}
    >
      {/* ヘッダー行 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {/* 総合判定バッジ */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xl font-bold font-mono ${config.badge}`}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          <span className={`text-sm font-mono opacity-60 ${config.text}`}>
            {config.labelEn}
          </span>
        </div>

        {/* 更新時刻 + ライブ/ダミー表示 */}
        <div className="flex items-center gap-2">
          {!marketData.isLive && (
            <span className="text-xs px-2 py-0.5 rounded bg-chart-border text-chart-muted font-mono">
              DEMO DATA
            </span>
          )}
          <span className="text-xs text-chart-muted font-mono">
            更新: {formattedTime}
          </span>
        </div>
      </div>

      {/* 価格ライン */}
      <div className="flex flex-wrap items-baseline gap-3 mb-4">
        <span className="text-3xl sm:text-4xl font-bold font-mono text-chart-text">
          {xauusd.price.toFixed(2)}
        </span>
        <span className="text-base font-mono text-chart-muted">XAUUSD</span>
        <span
          className={`text-lg font-bold font-mono ${
            isPositive ? "text-bull" : "text-bear"
          }`}
        >
          {isPositive ? "+" : ""}
          {xauusd.change.toFixed(2)} ({isPositive ? "+" : ""}
          {xauusd.changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* OHLC */}
      <div className="grid grid-cols-4 gap-2 mb-4 font-mono text-xs">
        {[
          { label: "始値", value: xauusd.open.toFixed(2) },
          { label: "高値", value: xauusd.high.toFixed(2) },
          { label: "安値", value: xauusd.low.toFixed(2) },
          { label: "現在", value: xauusd.price.toFixed(2) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-chart-bg rounded-lg p-2 text-center border border-chart-border"
          >
            <div className="text-chart-muted text-[10px] mb-0.5">{label}</div>
            <div className="text-chart-text">{value}</div>
          </div>
        ))}
      </div>

      {/* 判定理由 */}
      <div className="mb-3">
        <p className={`text-sm font-semibold ${config.text} mb-1`}>
          判定根拠
        </p>
        <p className="text-sm text-chart-text leading-relaxed">{reason}</p>
      </div>

      {/* サマリー */}
      <div className="bg-chart-bg rounded-lg p-3 border border-chart-border">
        <p className="text-xs text-chart-muted leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
