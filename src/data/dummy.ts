// ===================================================================
// XAUUSD Trading Assistant - Dummy Data
// ===================================================================
// このファイルはAPIが未接続の場合に使用するダミーデータです。
// 実APIに接続する際は src/hooks/useMarketData.ts の useDummy フラグを
// false に変更し、対応するAPI関数を実装してください。
// ===================================================================

import type {
  MarketData,
  TimeframeTrend,
  MacroFactor,
  PriceLevel,
} from "@/types";

// ---------------------------------------------------------------
// 市場データ（ダミー）
// ---------------------------------------------------------------

export const DUMMY_MARKET_DATA: MarketData = {
  xauusd: {
    price: 5092.40,
    change: -18.60,
    changePercent: -0.36,
    high: 5118.20,
    low: 5078.30,
    open: 5111.00,
    timestamp: new Date().toISOString(),
  },
  dxy: {
    value: 104.82,
    change: 0.34,
    changePercent: 0.32,
    trend: "UP",
  },
  us10y: {
    yield: 4.58,
    change: 0.03,
    trend: "UP",
  },
  updatedAt: new Date().toISOString(),
  isLive: false,
};

// ---------------------------------------------------------------
// 時間足トレンド（ダミー）
// Grok分析結果に基づく: 日足のみ上、他は全て下
// ---------------------------------------------------------------

export const DUMMY_TIMEFRAME_TRENDS: TimeframeTrend[] = [
  {
    timeframe: "D1",
    direction: "UP",
    strength: "MODERATE",
    description: "日足は上昇トレンド継続。高値更新が続くも勢い鈍化。",
    rsi: 58,
  },
  {
    timeframe: "H4",
    direction: "DOWN",
    strength: "MODERATE",
    description: "4時間足は下降転換。5160から反落後、5103割れ。",
    rsi: 42,
  },
  {
    timeframe: "H1",
    direction: "DOWN",
    strength: "STRONG",
    description: "1時間足は明確な下降。EMA短期が長期を下抜け。",
    rsi: 35,
  },
  {
    timeframe: "M15",
    direction: "DOWN",
    strength: "STRONG",
    description: "15分足は下降継続。5080サポート接近中。",
    rsi: 32,
  },
  {
    timeframe: "M5",
    direction: "DOWN",
    strength: "WEAK",
    description: "5分足は下降だが5080付近で売り圧力弱まる兆候。",
    rsi: 30,
  },
];

// ---------------------------------------------------------------
// マクロ要因（ダミー）
// スコア: +2=強い追い風, +1=追い風, 0=中立, -1=逆風, -2=強い逆風
// ---------------------------------------------------------------

export const DUMMY_MACRO_FACTORS: MacroFactor[] = [
  {
    id: "DXY",
    name: "DXY（ドル指数）",
    value: "104.82 (+0.32%)",
    sentiment: "HEADWIND",
    score: -2,
    description: "ドル強い → ゴールドに強い逆風",
    detail:
      "DXYは104台を維持。ドル高環境が続く限りゴールドの上値は重い。105超えでさらに逆風強化。",
  },
  {
    id: "US10Y",
    name: "米10年債利回り",
    value: "4.58% (+0.03%)",
    sentiment: "HEADWIND",
    score: -2,
    description: "利回り上昇 → ゴールドに逆風",
    detail:
      "実質金利上昇でゴールドの保有コストが増加。4.6%超えでさらに圧迫強まる可能性。",
  },
  {
    id: "FED_RATE",
    name: "FRB利下げ期待",
    value: "2025年前半後退",
    sentiment: "HEADWIND",
    score: -1,
    description: "利下げ期待後退 → 逆風",
    detail:
      "強い雇用統計を受け、市場の利下げ期待が後退。早期利下げ観測が後退しゴールドの追い風喪失。",
  },
  {
    id: "GEOPOLITICS",
    name: "地政学リスク",
    value: "中東情勢・緊張継続",
    sentiment: "TAILWIND",
    score: 2,
    description: "地政学リスク高 → ゴールドに強い追い風",
    detail:
      "中東の紛争リスクが継続。有事の金需要が下値を支える。エスカレートすれば急騰リスクあり。",
  },
  {
    id: "INFLATION",
    name: "インフレ動向",
    value: "CPI高止まり・石油高",
    sentiment: "NEUTRAL",
    score: 0,
    description: "インフレはゴールドに中立〜やや逆風",
    detail:
      "インフレ自体はゴールドに追い風だが、FRBの引き締め長期化を招くため相殺される構造。",
  },
  {
    id: "EMPLOYMENT",
    name: "米雇用統計",
    value: "やや悪化傾向",
    sentiment: "TAILWIND",
    score: 1,
    description: "雇用悪化 → 利下げ期待でやや追い風",
    detail:
      "雇用指標の悪化が見られ、景気後退懸念からゴールドの安全資産需要が高まる可能性。",
  },
];

// ---------------------------------------------------------------
// 重要価格帯（ダミー）
// ---------------------------------------------------------------

export const DUMMY_PRICE_LEVELS: PriceLevel[] = [
  {
    id: "resistance_top",
    type: "RESISTANCE",
    price: "5240〜5264",
    priceMin: 5240,
    priceMax: 5264,
    description: "高値抵抗帯（直近高値圏）",
    isActive: false,
  },
  {
    id: "resistance_mid",
    type: "RESISTANCE",
    price: "5103〜5111",
    priceMin: 5103,
    priceMax: 5111,
    description: "中期レジスタンス（戻り売り候補）",
    isActive: true,
  },
  {
    id: "resistance_key",
    type: "KEY_ZONE",
    price: 5160,
    description: "上抜けキーレベル（5160超えで上昇加速）",
    isActive: false,
  },
  {
    id: "support_main",
    type: "SUPPORT",
    price: 5080,
    description: "主要サポート（現在価格付近・反発注目）",
    isActive: true,
  },
  {
    id: "support_zone",
    type: "SUPPORT",
    price: "5052〜5078",
    priceMin: 5052,
    priceMax: 5078,
    description: "安値支持帯",
    isActive: true,
  },
  {
    id: "support_64",
    type: "SUPPORT",
    price: 5064,
    description: "サポート2（5080割れ後の次の支持）",
    isActive: false,
  },
  {
    id: "support_50",
    type: "SUPPORT",
    price: 5050,
    description: "心理的サポート（下抜けで売り加速）",
    isActive: false,
  },
  {
    id: "breakout_up",
    type: "BREAKOUT_UP",
    price: "5160超 → 5200〜5240",
    priceMin: 5160,
    priceMax: 5240,
    description: "上抜け加速帯（ブレイクアウト目標）",
    isActive: false,
  },
  {
    id: "breakout_down",
    type: "BREAKOUT_DOWN",
    price: "5050割れ → 5000〜4995",
    priceMin: 4995,
    priceMax: 5050,
    description: "下抜け加速帯（下落加速目標）",
    isActive: false,
  },
];

// ---------------------------------------------------------------
// RSI判定の基準値
// ---------------------------------------------------------------

export const RSI_THRESHOLDS = {
  OVERSOLD: 30,
  OVERBOUGHT: 70,
  NEUTRAL_LOW: 40,
  NEUTRAL_HIGH: 60,
} as const;

// ---------------------------------------------------------------
// エントリー判定のキー価格レベル
// ---------------------------------------------------------------

export const KEY_PRICE_LEVELS = {
  RESISTANCE_HIGH: 5160,
  RESISTANCE_MID_LOW: 5103,
  RESISTANCE_MID_HIGH: 5111,
  SUPPORT_MAIN: 5080,
  SUPPORT_LOW: 5050,
  BREAKOUT_UP_TARGET: 5240,
  BREAKOUT_DOWN_TARGET: 5000,
} as const;
