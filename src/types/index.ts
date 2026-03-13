// ===================================================================
// XAUUSD Trading Assistant - Type Definitions
// ===================================================================

// ---------------------------------------------------------------
// 基本列挙型
// ---------------------------------------------------------------

/** トレンド方向 */
export type TrendDirection = "UP" | "DOWN" | "SIDEWAYS";

/** 総合判定 */
export type OverallJudgment = "BULL" | "BEAR" | "WAIT";

/** マクロ要因の方向感 */
export type MacroSentiment = "TAILWIND" | "HEADWIND" | "NEUTRAL";

/** 価格帯種別 */
export type PriceLevelType =
  | "SUPPORT"
  | "RESISTANCE"
  | "BREAKOUT_UP"
  | "BREAKOUT_DOWN"
  | "KEY_ZONE";

/** 通知優先度 */
export type NotificationPriority = "HIGH" | "MEDIUM" | "LOW";

/** シナリオ種別 */
export type ScenarioType = "BULL" | "BEAR" | "WAIT";

/** エントリー方向 */
export type EntrySide = "BUY" | "SELL";

// ---------------------------------------------------------------
// 市場データ
// ---------------------------------------------------------------

/** XAUUSDの価格情報 */
export interface XauusdData {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
}

/** DXY（ドル指数）情報 */
export interface DxyData {
  value: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
}

/** 米10年債利回り */
export interface Us10yData {
  yield: number;
  change: number;
  trend: TrendDirection;
}

/** 全市場データ（APIレスポンス統合型） */
export interface MarketData {
  xauusd: XauusdData;
  dxy: DxyData;
  us10y: Us10yData;
  updatedAt: string;
  isLive: boolean; // true=実データ, false=ダミー
}

// ---------------------------------------------------------------
// 時間足トレンド
// ---------------------------------------------------------------

/** 時間足の識別子 */
export type Timeframe = "D1" | "H4" | "H1" | "M15" | "M5";

/** 時間足ラベル定義 */
export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  D1: "日足",
  H4: "4時間足",
  H1: "1時間足",
  M15: "15分足",
  M5: "5分足",
};

/** 単一時間足のトレンド情報 */
export interface TimeframeTrend {
  timeframe: Timeframe;
  direction: TrendDirection;
  strength: "STRONG" | "MODERATE" | "WEAK";
  description: string;
  ema_fast?: number; // 短期EMA（将来API接続時）
  ema_slow?: number; // 長期EMA（将来API接続時）
  rsi?: number;      // RSI値（将来API接続時）
}

// ---------------------------------------------------------------
// マクロ要因
// ---------------------------------------------------------------

/** マクロ要因の識別子 */
export type MacroFactorId =
  | "DXY"
  | "US10Y"
  | "FED_RATE"
  | "GEOPOLITICS"
  | "INFLATION"
  | "EMPLOYMENT";

/** マクロ要因カード */
export interface MacroFactor {
  id: MacroFactorId;
  name: string;
  value: string;
  sentiment: MacroSentiment;
  score: number;      // -2〜+2 (マイナス=逆風, プラス=追い風)
  description: string;
  detail?: string;
}

/** マクロスコア集計 */
export interface MacroScore {
  tailwind: number;    // 追い風合計スコア
  headwind: number;    // 逆風合計スコア（正の値）
  net: number;         // net = tailwind - headwind
  judgment: MacroSentiment;
  factors: MacroFactor[];
}

// ---------------------------------------------------------------
// 価格帯
// ---------------------------------------------------------------

/** 重要価格帯 */
export interface PriceLevel {
  id: string;
  type: PriceLevelType;
  price: number | string; // 単値 or "5080〜5111" などのレンジ文字列
  priceMin?: number;      // レンジ下限
  priceMax?: number;      // レンジ上限
  description: string;
  isActive?: boolean;     // 現在価格付近かどうか
}

// ---------------------------------------------------------------
// シナリオ
// ---------------------------------------------------------------

/** トレードシナリオ */
export interface Scenario {
  type: ScenarioType;
  title: string;
  conditions: string[];
  target?: string;
  stopLoss?: string;
  probability?: "HIGH" | "MEDIUM" | "LOW";
  isActive: boolean; // 現在の相場状況で有効かどうか
}

// ---------------------------------------------------------------
// エントリー条件
// ---------------------------------------------------------------

/** エントリー条件 */
export interface EntryCondition {
  id: string;
  side: EntrySide;
  title: string;
  conditions: string[];
  target: string;
  stopLoss: string;
  riskReward: string;
  isTriggered: boolean; // 現在の相場で条件が揃っているか
}

// ---------------------------------------------------------------
// 通知
// ---------------------------------------------------------------

/** 通知候補 */
export interface NotificationCandidate {
  id: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  triggerCondition: string;
  isActive: boolean; // 現在有効かどうか
  timestamp: string;
}

// ---------------------------------------------------------------
// 総合分析結果（全コンポーネントに渡す中央データ型）
// ---------------------------------------------------------------

/** 分析結果全体 */
export interface AnalysisResult {
  overallJudgment: OverallJudgment;
  overallReason: string;
  marketData: MarketData;
  macroScore: MacroScore;
  timeframeTrends: TimeframeTrend[];
  priceLevels: PriceLevel[];
  scenarios: Scenario[];
  entryConditions: EntryCondition[];
  notifications: NotificationCandidate[];
  summary: string;
  analyzedAt: string;
}

// ---------------------------------------------------------------
// API レスポンス型（将来のAPI差し替え用）
// ---------------------------------------------------------------

/** Alpha Vantage FOREX_INTRADAY レスポンス（将来実装） */
export interface AlphaVantageForexResponse {
  "Meta Data": Record<string, string>;
  "Time Series FX (5min)": Record<
    string,
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
    }
  >;
}

/** Twelve Data リアルタイムレスポンス（将来実装） */
export interface TwelveDataQuoteResponse {
  symbol: string;
  name: string;
  exchange: string;
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  change: string;
  percent_change: string;
}

/** データ取得状態 */
export interface DataFetchState {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  lastUpdated?: string;
}
