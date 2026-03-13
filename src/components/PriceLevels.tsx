"use client";

import type { PriceLevel, PriceLevelType } from "@/types";

interface Props {
  priceLevels: PriceLevel[];
  currentPrice: number;
}

const levelTypeConfig: Record<
  PriceLevelType,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  RESISTANCE: {
    label: "レジスタンス",
    color: "text-bear",
    bg: "bg-bear-bg",
    border: "border-bear-border",
    icon: "R",
  },
  SUPPORT: {
    label: "サポート",
    color: "text-bull",
    bg: "bg-bull-bg",
    border: "border-bull-border",
    icon: "S",
  },
  KEY_ZONE: {
    label: "キーレベル",
    color: "text-wait",
    bg: "bg-wait-bg",
    border: "border-wait-border",
    icon: "K",
  },
  BREAKOUT_UP: {
    label: "上抜け目標",
    color: "text-bull",
    bg: "bg-bull-bg",
    border: "border-bull-border",
    icon: "▲",
  },
  BREAKOUT_DOWN: {
    label: "下抜け目標",
    color: "text-bear",
    bg: "bg-bear-bg",
    border: "border-bear-border",
    icon: "▼",
  },
};

function PriceBar({
  level,
  currentPrice,
}: {
  level: PriceLevel;
  currentPrice: number;
}) {
  // 価格バー: 4900〜5300の範囲でスケーリング
  const MIN = 4900;
  const MAX = 5300;

  const getPosition = (price: number) =>
    Math.max(0, Math.min(100, ((price - MIN) / (MAX - MIN)) * 100));

  const currentPct = getPosition(currentPrice);

  // 単価 or レンジの中心を取得
  let displayPrice: number;
  if (typeof level.price === "number") {
    displayPrice = level.price;
  } else if (level.priceMin && level.priceMax) {
    displayPrice = (level.priceMin + level.priceMax) / 2;
  } else {
    return null;
  }

  const levelPct = getPosition(displayPrice);
  const cfg = levelTypeConfig[level.type];

  return (
    <div className="relative h-1 w-full bg-chart-border rounded-full">
      {/* 現在価格マーカー */}
      <div
        className="absolute w-0.5 h-3 -top-1 bg-gold-400 rounded-full z-10"
        style={{ left: `${currentPct}%` }}
      />
      {/* レベルマーカー */}
      <div
        className={`absolute w-1 h-3 -top-1 rounded-full z-5 ${cfg.color === "text-bull" ? "bg-bull" : cfg.color === "text-bear" ? "bg-bear" : "bg-wait"}`}
        style={{ left: `${levelPct}%` }}
      />
    </div>
  );
}

export default function PriceLevels({ priceLevels, currentPrice }: Props) {
  // 種別でグループ化
  const resistances = priceLevels.filter((l) => l.type === "RESISTANCE" || l.type === "KEY_ZONE");
  const supports = priceLevels.filter((l) => l.type === "SUPPORT");
  const breakouts = priceLevels.filter(
    (l) => l.type === "BREAKOUT_UP" || l.type === "BREAKOUT_DOWN"
  );

  return (
    <div className="rounded-xl border border-chart-border bg-chart-card p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-chart-text uppercase tracking-wider">
          重要価格帯
        </h2>
        <span className="text-xs font-mono text-chart-muted">
          現在: <span className="text-gold-400 font-bold">{currentPrice.toFixed(2)}</span>
        </span>
      </div>

      {/* ビジュアルバー */}
      <div className="bg-chart-bg rounded-lg p-4 mb-4 border border-chart-border">
        <div className="relative h-8 w-full">
          {/* レンジバー背景 */}
          <div className="absolute top-3.5 left-0 right-0 h-1 bg-chart-border rounded-full" />
          {/* 現在価格ライン */}
          <div
            className="absolute top-0 w-px h-8 bg-gold-400 z-20"
            style={{
              left: `${Math.max(0, Math.min(100, ((currentPrice - 4900) / 400) * 100))}%`,
            }}
          >
            <div className="absolute -top-4 -translate-x-1/2 text-[10px] font-mono text-gold-400 whitespace-nowrap font-bold">
              {currentPrice.toFixed(0)}
            </div>
          </div>
          {/* 各レベルマーカー */}
          {priceLevels.map((level) => {
            let price: number | null = null;
            if (typeof level.price === "number") {
              price = level.price;
            } else if (level.priceMin && level.priceMax) {
              price = (level.priceMin + level.priceMax) / 2;
            }
            if (!price) return null;

            const pct = Math.max(0, Math.min(100, ((price - 4900) / 400) * 100));
            const cfg = levelTypeConfig[level.type];
            const color =
              cfg.color === "text-bull"
                ? "#22c55e"
                : cfg.color === "text-bear"
                ? "#ef4444"
                : "#f59e0b";

            return (
              <div
                key={level.id}
                className="absolute top-2 w-0.5 h-4 rounded-full z-10"
                style={{ left: `${pct}%`, backgroundColor: color }}
                title={`${level.description}: ${level.price}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-chart-muted font-mono mt-2">
          <span>4900</span>
          <span>5100</span>
          <span>5300</span>
        </div>
      </div>

      {/* レジスタンス帯 */}
      <div className="mb-3">
        <h3 className="text-[11px] font-bold text-bear mb-2 uppercase tracking-wider font-mono">
          レジスタンス / キーレベル
        </h3>
        <div className="space-y-1.5">
          {resistances.map((level) => {
            const cfg = levelTypeConfig[level.type];
            return (
              <div
                key={level.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  level.isActive
                    ? `${cfg.bg} ${cfg.border}`
                    : "bg-chart-bg border-chart-border"
                }`}
              >
                <span
                  className={`text-[10px] font-bold font-mono w-5 h-5 flex items-center justify-center rounded ${cfg.bg} ${cfg.color} border ${cfg.border} flex-shrink-0`}
                >
                  {cfg.icon}
                </span>
                <span className={`font-mono font-bold text-xs ${cfg.color}`}>
                  {typeof level.price === "number"
                    ? level.price.toFixed(0)
                    : level.price}
                </span>
                <span className="text-[11px] text-chart-muted flex-1">
                  {level.description}
                </span>
                {level.isActive && (
                  <span className="text-[10px] text-wait font-mono flex-shrink-0">
                    ◆ 注目
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* サポート帯 */}
      <div className="mb-3">
        <h3 className="text-[11px] font-bold text-bull mb-2 uppercase tracking-wider font-mono">
          サポート
        </h3>
        <div className="space-y-1.5">
          {supports.map((level) => {
            const cfg = levelTypeConfig[level.type];
            return (
              <div
                key={level.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  level.isActive
                    ? `${cfg.bg} ${cfg.border}`
                    : "bg-chart-bg border-chart-border"
                }`}
              >
                <span
                  className={`text-[10px] font-bold font-mono w-5 h-5 flex items-center justify-center rounded ${cfg.bg} ${cfg.color} border ${cfg.border} flex-shrink-0`}
                >
                  {cfg.icon}
                </span>
                <span className={`font-mono font-bold text-xs ${cfg.color}`}>
                  {typeof level.price === "number"
                    ? level.price.toFixed(0)
                    : level.price}
                </span>
                <span className="text-[11px] text-chart-muted flex-1">
                  {level.description}
                </span>
                {level.isActive && (
                  <span className="text-[10px] text-wait font-mono flex-shrink-0">
                    ◆ 注目
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ブレイクアウト帯 */}
      <div>
        <h3 className="text-[11px] font-bold text-chart-accent mb-2 uppercase tracking-wider font-mono">
          ブレイクアウト目標
        </h3>
        <div className="space-y-1.5">
          {breakouts.map((level) => {
            const cfg = levelTypeConfig[level.type];
            return (
              <div
                key={level.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-chart-bg border-chart-border"
              >
                <span className={`text-xs font-bold font-mono ${cfg.color}`}>
                  {cfg.icon}
                </span>
                <span className={`font-mono text-xs ${cfg.color}`}>
                  {typeof level.price === "number"
                    ? level.price.toFixed(0)
                    : level.price}
                </span>
                <span className="text-[11px] text-chart-muted flex-1">
                  {level.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
