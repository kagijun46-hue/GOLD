"use client";

import type { TimeframeTrend, TrendDirection, TIMEFRAME_LABELS } from "@/types";
import { TIMEFRAME_LABELS as TF_LABELS } from "@/types";

interface Props {
  trends: TimeframeTrend[];
}

const directionConfig: Record<
  TrendDirection,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  UP: {
    label: "上昇",
    icon: "▲",
    color: "text-bull",
    bg: "bg-bull-bg",
    border: "border-bull-border",
  },
  DOWN: {
    label: "下降",
    icon: "▼",
    color: "text-bear",
    bg: "bg-bear-bg",
    border: "border-bear-border",
  },
  SIDEWAYS: {
    label: "横ばい",
    icon: "◆",
    color: "text-wait",
    bg: "bg-wait-bg",
    border: "border-wait-border",
  },
};

const strengthConfig = {
  STRONG: { label: "強", color: "text-chart-text", dots: 3 },
  MODERATE: { label: "中", color: "text-chart-muted", dots: 2 },
  WEAK: { label: "弱", color: "text-chart-muted opacity-60", dots: 1 },
};

function RsiBar({ rsi }: { rsi?: number }) {
  if (!rsi) return <span className="text-chart-muted">-</span>;

  const isOversold = rsi <= 30;
  const isOverbought = rsi >= 70;
  const pct = rsi;

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-chart-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isOversold ? "bg-bear" : isOverbought ? "bg-bull" : "bg-chart-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-mono ${
          isOversold ? "text-bear font-bold" : isOverbought ? "text-bull font-bold" : "text-chart-muted"
        }`}
      >
        {rsi}
      </span>
    </div>
  );
}

function StrengthDots({ strength }: { strength: TimeframeTrend["strength"] }) {
  const cfg = strengthConfig[strength];
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= cfg.dots ? "bg-chart-accent" : "bg-chart-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function TrendTable({ trends }: Props) {
  // 上位足から下位足へのアライメント状態を表示するための矢印
  const directions = trends.map((t) => t.direction);
  const allDown = directions.every((d) => d === "DOWN");
  const allUp = directions.every((d) => d === "UP");
  const dailyUp = trends.find((t) => t.timeframe === "D1")?.direction === "UP";
  const shortTermDown = trends
    .filter((t) => t.timeframe !== "D1")
    .every((t) => t.direction === "DOWN");

  let alignmentMessage = "";
  let alignmentColor = "text-chart-muted";
  if (allUp) {
    alignmentMessage = "全足上昇で整合 → 強気地合い";
    alignmentColor = "text-bull";
  } else if (allDown) {
    alignmentMessage = "全足下降で整合 → 弱気地合い";
    alignmentColor = "text-bear";
  } else if (dailyUp && shortTermDown) {
    alignmentMessage = "日足↑・短期↓ → 押し目候補。反転確認待ち。";
    alignmentColor = "text-wait";
  } else {
    alignmentMessage = "時間足間で方向が混在 → 様子見";
    alignmentColor = "text-wait";
  }

  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
          時間足トレンド
        </h2>
      </div>

      {/* アライメントサマリー */}
      <div
        className={`text-xs font-semibold mb-3 px-3 py-2 rounded-lg bg-chart-bg border border-chart-border ${alignmentColor}`}
      >
        {alignmentMessage}
      </div>

      {/* トレンドテーブル（モバイル最適化） */}
      <div className="space-y-2">
        {trends.map((trend) => {
          const dirCfg = directionConfig[trend.direction];
          const isD1 = trend.timeframe === "D1";

          return (
            <div
              key={trend.timeframe}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isD1
                  ? "border-chart-border2 bg-chart-bg"
                  : "border-chart-border bg-chart-bg"
              }`}
            >
              {/* 時間足ラベル */}
              <div className="w-14 flex-shrink-0">
                <span
                  className={`text-xs font-bold font-mono ${
                    isD1 ? "text-chart-text" : "text-chart-muted"
                  }`}
                >
                  {TF_LABELS[trend.timeframe]}
                </span>
              </div>

              {/* トレンド方向バッジ */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold font-mono flex-shrink-0 ${dirCfg.bg} ${dirCfg.border} ${dirCfg.color}`}
              >
                <span>{dirCfg.icon}</span>
                <span>{dirCfg.label}</span>
              </div>

              {/* 強度 */}
              <StrengthDots strength={trend.strength} />

              {/* RSI */}
              <div className="flex-shrink-0">
                <RsiBar rsi={trend.rsi} />
              </div>

              {/* 説明（デスクトップのみ） */}
              <p className="hidden sm:block text-[11px] text-chart-muted leading-relaxed flex-1 min-w-0 truncate">
                {trend.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 説明（モバイルでは各行の下に展開） */}
      <div className="sm:hidden mt-2 space-y-1">
        {trends.map((trend) => (
          <p key={`desc-${trend.timeframe}`} className="text-[10px] text-chart-muted px-1">
            <span className="text-chart-text font-mono text-[10px]">
              {TF_LABELS[trend.timeframe]}:
            </span>{" "}
            {trend.description}
          </p>
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-3 pt-3 border-t border-chart-border flex flex-wrap gap-3 text-[10px] text-chart-muted font-mono">
        <span>● = 強度（●●●=強, ●●=中, ●=弱）</span>
        <span>RSI≤30=売られすぎ, ≥70=買われすぎ</span>
      </div>
    </div>
  );
}
