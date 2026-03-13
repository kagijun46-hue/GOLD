// ===================================================================
// Twelve Data API Client
// https://twelvedata.com/docs
//
// 無料プランの制限:
//   - 800 リクエスト/日
//   - 8 リクエスト/分
//   - 遅延あり（リアルタイムではない）
//
// 本番環境では有料プランへの移行を推奨。
// ===================================================================

const BASE_URL = "https://api.twelvedata.com";

// ---------------------------------------------------------------
// Twelve Data API レスポンス型
// ---------------------------------------------------------------

export interface TDQuoteResponse {
  symbol: string;
  name: string;
  exchange: string;
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
  previous_close: string;
  change: string;
  percent_change: string;
  is_market_open: boolean;
  fifty_two_week: {
    low: string;
    high: string;
  };
  status?: string; // "ok" or error
  code?: number;
  message?: string;
}

export interface TDTimeSeriesValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

export interface TDTimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    type: string;
  };
  values: TDTimeSeriesValue[];
  status: string;
  code?: number;
  message?: string;
}

// Twelve Data がサポートする時間足
export type TDInterval =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "45min"
  | "1h"
  | "2h"
  | "4h"
  | "8h"
  | "1day"
  | "1week"
  | "1month";

// ---------------------------------------------------------------
// API クライアント
// ---------------------------------------------------------------

export class TwelveDataClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = BASE_URL;
  }

  /**
   * 指定シンボルの最新クォートを取得する
   * @param symbol - 例: "XAU/USD", "DXY", "TNX"
   */
  async getQuote(symbol: string): Promise<TDQuoteResponse> {
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", this.apiKey);

    const response = await fetchWithTimeout(url.toString(), 8000);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
    }

    const data: TDQuoteResponse = await response.json();

    if (data.code && data.code !== 200) {
      throw new Error(`Twelve Data API error ${data.code}: ${data.message}`);
    }

    return data;
  }

  /**
   * 指定シンボル・時間足のOHLCデータを取得する
   * @param symbol - 例: "XAU/USD"
   * @param interval - 例: "1day", "4h", "1h", "15min", "5min"
   * @param outputsize - 取得本数（最大で計算に必要な分）
   */
  async getTimeSeries(
    symbol: string,
    interval: TDInterval,
    outputsize = 60
  ): Promise<TDTimeSeriesResponse> {
    const url = new URL(`${this.baseUrl}/time_series`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("outputsize", String(outputsize));
    url.searchParams.set("apikey", this.apiKey);

    const response = await fetchWithTimeout(url.toString(), 10000);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
    }

    const data: TDTimeSeriesResponse = await response.json();

    if (data.status === "error" || (data.code && data.code !== 200)) {
      throw new Error(`Twelve Data API error ${data.code}: ${data.message}`);
    }

    if (!data.values || data.values.length === 0) {
      throw new Error(`No data returned for ${symbol} ${interval}`);
    }

    return data;
  }

  /**
   * 複数シンボルのクォートを並行取得する
   * 注意: 無料プランは8req/分の制限があるため、4シンボル以上は間隔を空けること
   */
  async getMultipleQuotes(
    symbols: string[]
  ): Promise<Map<string, TDQuoteResponse>> {
    const results = new Map<string, TDQuoteResponse>();

    // 並行リクエスト（最大4並行で制限を考慮）
    const chunks = chunkArray(symbols, 4);

    for (const chunk of chunks) {
      const responses = await Promise.allSettled(
        chunk.map((symbol) => this.getQuote(symbol))
      );

      responses.forEach((result, i) => {
        if (result.status === "fulfilled") {
          results.set(chunk[i], result.value);
        } else {
          console.warn(`Failed to fetch quote for ${chunk[i]}:`, result.reason);
        }
      });

      // レート制限対策: チャンク間に間隔を空ける
      if (chunks.length > 1) {
        await sleep(1000);
      }
    }

    return results;
  }

  /**
   * 複数時間足のOHLCデータを並行取得する（レート制限考慮）
   */
  async getMultipleTimeSeries(
    symbol: string,
    intervals: TDInterval[],
    outputsize = 60
  ): Promise<Map<TDInterval, TDTimeSeriesResponse>> {
    const results = new Map<TDInterval, TDTimeSeriesResponse>();

    // 無料プランでは4並行以内に抑える
    const chunks = chunkArray(intervals, 4);

    for (const chunk of chunks) {
      const responses = await Promise.allSettled(
        chunk.map((interval) =>
          this.getTimeSeries(symbol, interval, outputsize)
        )
      );

      responses.forEach((result, i) => {
        if (result.status === "fulfilled") {
          results.set(chunk[i], result.value);
        } else {
          console.warn(
            `Failed to fetch time series for ${symbol} ${chunk[i]}:`,
            result.reason
          );
        }
      });

      if (chunks.length > 1) {
        await sleep(2000); // レート制限対策
      }
    }

    return results;
  }
}

// ---------------------------------------------------------------
// ファクトリ関数（APIキーのバリデーション含む）
// ---------------------------------------------------------------

/**
 * APIキーを検証してクライアントを生成する
 * キーがなければエラーをスローする（サーバーサイドでのみ使用）
 */
export function createTwelveDataClient(): TwelveDataClient {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey || apiKey === "your_key_here" || apiKey.trim() === "") {
    throw new Error(
      "TWELVE_DATA_API_KEY が設定されていません。" +
        ".env.local に TWELVE_DATA_API_KEY=あなたのAPIキー を設定してください。" +
        "無料キーの取得: https://twelvedata.com/"
    );
  }

  return new TwelveDataClient(apiKey);
}

// ---------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
