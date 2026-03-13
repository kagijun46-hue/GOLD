"use client";

import type { Scenario, ScenarioType } from "@/types";

interface Props {
  scenarios: Scenario[];
}

const scenarioConfig: Record<
  ScenarioType,
  {
    title: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    activeBg: string;
    activeBorder: string;
    activeGlow: string;
  }
> = {
  BULL: {
    title: "買いシナリオ",
    icon: "▲",
    color: "text-bull",
    bg: "bg-chart-bg",
    border: "border-chart-border",
    activeBg: "bg-bull-bg",
    activeBorder: "border-bull-border",
    activeGlow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]",
  },
  BEAR: {
    title: "売りシナリオ",
    icon: "▼",
    color: "text-bear",
    bg: "bg-chart-bg",
    border: "border-chart-border",
    activeBg: "bg-bear-bg",
    activeBorder: "border-bear-border",
    activeGlow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  },
  WAIT: {
    title: "様子見シナリオ",
    icon: "◆",
    color: "text-wait",
    bg: "bg-chart-bg",
    border: "border-chart-border",
    activeBg: "bg-wait-bg",
    activeBorder: "border-wait-border",
    activeGlow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  },
};

const probabilityConfig = {
  HIGH: { label: "高", color: "text-bull", bg: "bg-bull/10 border-bull/30" },
  MEDIUM: { label: "中", color: "text-wait", bg: "bg-wait/10 border-wait/30" },
  LOW: { label: "低", color: "text-chart-muted", bg: "bg-chart-border/50 border-chart-border" },
};

export default function ScenarioCards({ scenarios }: Props) {
  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
          実戦シナリオ
        </h2>
        <span className="text-[10px] text-chart-muted font-mono">
          ◆=現在有効
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {scenarios.map((scenario) => {
          const cfg = scenarioConfig[scenario.type];
          const probCfg = scenario.probability
            ? probabilityConfig[scenario.probability]
            : null;

          return (
            <div
              key={scenario.type}
              className={`rounded-lg border p-4 transition-all duration-300 ${
                scenario.isActive
                  ? `${cfg.activeBg} ${cfg.activeBorder} ${cfg.activeGlow}`
                  : `${cfg.bg} ${cfg.border} opacity-60`
              }`}
            >
              {/* シナリオヘッダー */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                  <span className={`text-sm font-bold ${cfg.color}`}>
                    {scenario.title}
                  </span>
                  {scenario.isActive && (
                    <span className="text-[10px] font-mono text-wait border border-wait/30 bg-wait/10 px-1.5 py-0.5 rounded">
                      有効
                    </span>
                  )}
                </div>
                {probCfg && (
                  <div
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${probCfg.bg} ${probCfg.color}`}
                  >
                    確度: {probCfg.label}
                  </div>
                )}
              </div>

              {/* 条件リスト */}
              <ul className="space-y-1.5 mb-3">
                {scenario.conditions.map((cond, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px] text-chart-text"
                  >
                    <span className={`mt-0.5 flex-shrink-0 text-[10px] ${cfg.color}`}>
                      ›
                    </span>
                    {cond}
                  </li>
                ))}
              </ul>

              {/* ターゲット/ストップ */}
              {(scenario.target || scenario.stopLoss) && (
                <div className="pt-2 border-t border-chart-border grid grid-cols-2 gap-2">
                  {scenario.target && (
                    <div className="bg-chart-bg rounded p-2 border border-chart-border">
                      <div className="text-[10px] text-chart-muted mb-0.5 font-mono">
                        目標
                      </div>
                      <div className="text-xs font-bold font-mono text-bull">
                        {scenario.target}
                      </div>
                    </div>
                  )}
                  {scenario.stopLoss && (
                    <div className="bg-chart-bg rounded p-2 border border-chart-border">
                      <div className="text-[10px] text-chart-muted mb-0.5 font-mono">
                        ストップ
                      </div>
                      <div className="text-xs font-bold font-mono text-bear">
                        {scenario.stopLoss}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
