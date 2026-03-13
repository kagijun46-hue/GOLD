"use client";

import { useState } from "react";
import type { NotificationCandidate, NotificationPriority } from "@/types";

interface Props {
  notifications: NotificationCandidate[];
}

const priorityConfig: Record<
  NotificationPriority,
  {
    label: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  HIGH: {
    label: "高",
    icon: "🚨",
    color: "text-bear",
    bg: "bg-bear-bg",
    border: "border-bear-border",
    dot: "bg-bear animate-pulse",
  },
  MEDIUM: {
    label: "中",
    icon: "⚠️",
    color: "text-wait",
    bg: "bg-wait-bg",
    border: "border-wait-border",
    dot: "bg-wait",
  },
  LOW: {
    label: "低",
    icon: "ℹ️",
    color: "text-chart-muted",
    bg: "bg-chart-bg",
    border: "border-chart-border",
    dot: "bg-chart-muted",
  },
};

export default function Notifications({ notifications }: Props) {
  const [filter, setFilter] = useState<NotificationPriority | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    filter === "ALL"
      ? notifications
      : notifications.filter((n) => n.priority === filter);

  const highCount = notifications.filter((n) => n.priority === "HIGH").length;
  const mediumCount = notifications.filter(
    (n) => n.priority === "MEDIUM"
  ).length;

  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
            通知候補
          </h2>
          {highCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-bear text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {highCount}
            </span>
          )}
        </div>
        <span className="text-[10px] text-chart-muted font-mono">
          将来: LINE / Telegram 通知対応
        </span>
      </div>

      {/* フィルターボタン */}
      <div className="flex gap-1.5 mb-3">
        {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all ${
              filter === f
                ? f === "ALL"
                  ? "bg-chart-accent/20 text-chart-accent border-chart-accent/30"
                  : f === "HIGH"
                  ? "bg-bear-bg text-bear border-bear-border"
                  : f === "MEDIUM"
                  ? "bg-wait-bg text-wait border-wait-border"
                  : "bg-chart-bg text-chart-muted border-chart-border"
                : "bg-chart-bg text-chart-muted border-chart-border hover:border-chart-border2"
            }`}
          >
            {f === "ALL" ? `全て(${notifications.length})` : f === "HIGH" ? `高(${highCount})` : f === "MEDIUM" ? `中(${mediumCount})` : "低"}
          </button>
        ))}
      </div>

      {/* 通知リスト */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-chart-muted text-sm py-6">
            通知候補はありません
          </div>
        ) : (
          filtered.map((notif) => {
            const cfg = priorityConfig[notif.priority];
            const isExpanded = expanded === notif.id;

            return (
              <div
                key={notif.id}
                className={`rounded-lg border overflow-hidden transition-all duration-200 ${
                  notif.priority === "HIGH"
                    ? `${cfg.bg} ${cfg.border}`
                    : notif.priority === "MEDIUM"
                    ? `${cfg.bg} ${cfg.border}`
                    : `${cfg.bg} ${cfg.border}`
                }`}
              >
                {/* 通知ヘッダー（クリックで展開） */}
                <button
                  className="w-full flex items-center gap-3 p-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : notif.id)}
                >
                  {/* 優先度ドット */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

                  {/* タイトル */}
                  <span className={`text-xs font-semibold flex-1 ${cfg.color}`}>
                    {notif.title}
                  </span>

                  {/* 優先度バッジ */}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      notif.priority === "HIGH"
                        ? "bg-bear/20 text-bear border-bear/30"
                        : notif.priority === "MEDIUM"
                        ? "bg-wait/20 text-wait border-wait/30"
                        : "bg-chart-border text-chart-muted border-chart-border"
                    }`}
                  >
                    優先度: {cfg.label}
                  </span>

                  {/* 展開アイコン */}
                  <span className="text-chart-muted text-xs flex-shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* 展開コンテンツ */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-chart-border">
                    <p className="text-[12px] text-chart-text leading-relaxed mt-2 mb-2">
                      {notif.message}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-chart-muted font-mono">
                          トリガー:
                        </span>
                        <span className="text-[10px] font-mono text-chart-accent">
                          {notif.triggerCondition}
                        </span>
                      </div>
                    </div>

                    {/* LINE/Telegram プレビュー */}
                    <div className="mt-2 pt-2 border-t border-chart-border">
                      <p className="text-[10px] text-chart-muted mb-1 font-mono">
                        通知プレビュー（将来実装）:
                      </p>
                      <div className="bg-chart-bg rounded p-2 border border-chart-border">
                        <pre className="text-[10px] text-chart-text font-mono whitespace-pre-wrap">
                          {notif.priority === "HIGH"
                            ? "🚨"
                            : notif.priority === "MEDIUM"
                            ? "⚠️"
                            : "ℹ️"}{" "}
                          {notif.title}
                          {"\n\n"}
                          {notif.message}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* LINE/Telegram 設定案内 */}
      <div className="mt-3 pt-3 border-t border-chart-border">
        <p className="text-[10px] text-chart-muted leading-relaxed">
          💡 <span className="text-chart-accent">将来の拡張:</span>{" "}
          <code className="font-mono">.env</code> に
          LINE_NOTIFY_TOKEN または TELEGRAM_BOT_TOKEN を設定することで、
          通知候補を自動送信できます。
          詳細は <code className="font-mono">src/lib/notification.ts</code> を参照。
        </p>
      </div>
    </div>
  );
}
