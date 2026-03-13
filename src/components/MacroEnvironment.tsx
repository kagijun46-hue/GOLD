"use client";

import type { MacroScore, MacroSentiment } from "@/types";

interface Props {
  macroScore: MacroScore;
}

const sentimentConfig: Record<
  MacroSentiment,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  TAILWIND: {
    label: "追い風",
    color: "text-bull",
    bg: "bg-bull-bg",
    border: "border-bull-border",
    dot: "bg-bull",
  },
  HEADWIND: {
    label: "逆風",
    color: "text-bear",
    bg: "bg-bear-bg",
    border: "border-bear-border",
    dot: "bg-bear",
  },
  NEUTRAL: {
    label: "中立",
    color: "text-wait",
    bg: "bg-wait-bg",
    border: "border-wait-border",
    dot: "bg-wait",
  },
};

function ScoreBar({ score }: { score: number }) {
  // -2〜+2 を 0〜100% にマッピング
  const pct = ((score + 2) / 4) * 100;
  const isPositive = score > 0;
  const isNegative = score < 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-chart-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPositive ? "bg-bull" : isNegative ? "bg-bear" : "bg-chart-muted"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-mono font-bold w-8 text-right ${
          isPositive ? "text-bull" : isNegative ? "text-bear" : "text-chart-muted"
        }`}
      >
        {score > 0 ? `+${score}` : score}
      </span>
    </div>
  );
}

export default function MacroEnvironment({ macroScore }: Props) {
  const { tailwind, headwind, net, judgment, factors } = macroScore;

  const overallConfig = sentimentConfig[judgment];

  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
          マクロ環境
        </h2>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${overallConfig.bg} ${overallConfig.border} ${overallConfig.color}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${overallConfig.dot}`}
          ></span>
          {overallConfig.label}優勢
        </div>
      </div>

      {/* スコアサマリー */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-chart-bg rounded-lg p-2.5 text-center border border-chart-border">
          <div className="text-[10px] text-chart-muted mb-1 font-mono">追い風</div>
          <div className="text-lg font-bold font-mono text-bull">
            +{tailwind}
          </div>
        </div>
        <div className="bg-chart-bg rounded-lg p-2.5 text-center border border-chart-border">
          <div className="text-[10px] text-chart-muted mb-1 font-mono">NET</div>
          <div
            className={`text-lg font-bold font-mono ${
              net > 0 ? "text-bull" : net < 0 ? "text-bear" : "text-wait"
            }`}
          >
            {net > 0 ? `+${net}` : net}
          </div>
        </div>
        <div className="bg-chart-bg rounded-lg p-2.5 text-center border border-chart-border">
          <div className="text-[10px] text-chart-muted mb-1 font-mono">逆風</div>
          <div className="text-lg font-bold font-mono text-bear">
            -{headwind}
          </div>
        </div>
      </div>

      {/* マクロ要因リスト */}
      <div className="space-y-2.5">
        {factors.map((factor) => {
          const cfg = sentimentConfig[factor.sentiment];
          return (
            <div
              key={factor.id}
              className="bg-chart-bg rounded-lg p-3 border border-chart-border"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${cfg.dot}`}></span>
                  <span className="text-xs font-bold text-chart-text truncate">
                    {factor.name}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="text-xs text-chart-muted mb-2 font-mono pl-4">
                {factor.value}
              </div>

              <ScoreBar score={factor.score} />

              <p className="text-[11px] text-chart-muted mt-1.5 pl-4 leading-relaxed">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
