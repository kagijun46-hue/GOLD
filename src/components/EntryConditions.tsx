"use client";

import type { EntryCondition } from "@/types";

interface Props {
  entryConditions: EntryCondition[];
}

export default function EntryConditions({ entryConditions }: Props) {
  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
          エントリー条件
        </h2>
        <span className="text-[10px] text-chart-muted font-mono">
          3条件以上 → 候補成立
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entryConditions.map((entry) => {
          const isBuy = entry.side === "BUY";
          const color = isBuy ? "text-bull" : "text-bear";
          const bg = isBuy ? "bg-bull-bg" : "bg-bear-bg";
          const border = isBuy ? "border-bull-border" : "border-bear-border";
          const glow = isBuy
            ? "shadow-[0_0_20px_rgba(34,197,94,0.12)]"
            : "shadow-[0_0_20px_rgba(239,68,68,0.12)]";
          const icon = isBuy ? "▲" : "▼";

          // 条件達成数を条件テキストの ✓ から数える
          const metCount = entry.conditions.filter((c) => c.includes("✓")).length;
          const totalCount = entry.conditions.length;
          const progressPct = (metCount / totalCount) * 100;

          return (
            <div
              key={entry.id}
              className={`rounded-lg border p-4 ${
                entry.isTriggered
                  ? `${bg} ${border} ${glow}`
                  : "bg-chart-bg border-chart-border"
              }`}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${color}`}>{icon}</span>
                  <span className={`text-sm font-bold ${color}`}>
                    {entry.title}
                  </span>
                </div>
                {entry.isTriggered ? (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-bull/20 text-bull border border-bull/30">
                    候補成立
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-chart-border text-chart-muted">
                    待機中
                  </span>
                )}
              </div>

              {/* プログレスバー（条件達成状況） */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-chart-muted font-mono">条件充足</span>
                  <span className={`font-mono font-bold ${color}`}>
                    {metCount}/{totalCount}
                  </span>
                </div>
                <div className="h-1.5 bg-chart-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBuy ? "bg-bull" : "bg-bear"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* 条件リスト */}
              <ul className="space-y-1.5 mb-3">
                {entry.conditions.map((cond, i) => {
                  const isMet = cond.includes("✓");
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-[11px] leading-relaxed ${
                        isMet ? "text-chart-text" : "text-chart-muted"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 mt-0.5 text-[10px] font-bold ${
                          isMet ? color : "text-chart-muted"
                        }`}
                      >
                        {isMet ? "✓" : "○"}
                      </span>
                      {/* ✓記号を除いた本文を表示 */}
                      {cond.replace(" ✓", "").replace("✓", "")}
                    </li>
                  );
                })}
              </ul>

              {/* TP/SL/RR */}
              <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-chart-border">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-chart-muted font-mono w-10">目標</span>
                  <span className="text-[11px] font-mono font-bold text-bull flex-1">
                    {entry.target}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-chart-muted font-mono w-10">SL</span>
                  <span className="text-[11px] font-mono font-bold text-bear flex-1">
                    {entry.stopLoss}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-chart-muted font-mono w-10">RR</span>
                  <span className={`text-[11px] font-mono font-bold ${color} flex-1`}>
                    {entry.riskReward}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
