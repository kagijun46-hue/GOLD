# XAUUSD Trading Assistant

ゴールド（XAUUSD）相場の環境認識・エントリー補助ダッシュボード MVP

> ⚠️ このツールは情報提供のみを目的としており、投資助言ではありません。

---

## 概要

相場を自動分析し、以下をひと目で確認できるトレーダー向けWebアプリです。

- **総合判定**（買い優勢 / 売り優勢 / 様子見）
- **マクロ環境**（DXY・米10年債・地政学・FRB動向）
- **時間足トレンド**（日足〜5分足）
- **重要価格帯**（サポート・レジスタンス・ブレイクアウト目標）
- **実戦シナリオ**（買い・売り・様子見）
- **エントリー条件チェック**（RR付き）
- **通知候補**（将来LINE/Telegram対応）

---

## セットアップ

### 必要環境

- Node.js 18以上
- npm / yarn / pnpm

### インストール

```bash
npm install
```

### 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` の設定:

```env
# ダミーデータ使用（デフォルト: true）
NEXT_PUBLIC_USE_DUMMY_DATA=true

# データ更新間隔（秒、デフォルト: 60）
NEXT_PUBLIC_REFRESH_INTERVAL=60
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能。

---

## ディレクトリ構成

```
src/
├── app/                   # Next.js App Router
├── types/index.ts         # 全型定義
├── data/dummy.ts          # ダミーデータ
├── lib/                   # ロジック関数群（純粋関数）
│   ├── trend.ts           # トレンド判定
│   ├── macro.ts           # マクロスコア計算
│   ├── scenario.ts        # シナリオ生成
│   ├── entrySignal.ts     # エントリー条件判定
│   ├── summary.ts         # 総合判定・サマリー
│   └── notification.ts    # 通知メッセージ生成
├── components/            # UIコンポーネント
│   ├── Dashboard.tsx      # メインダッシュボード
│   ├── OverallJudgment.tsx
│   ├── MacroEnvironment.tsx
│   ├── TrendTable.tsx
│   ├── PriceLevels.tsx
│   ├── ScenarioCards.tsx
│   ├── EntryConditions.tsx
│   └── Notifications.tsx
└── hooks/
    └── useMarketData.ts   # データ取得フック（API差し替えポイント）
```

---

## 判定ロジック概要

### マクロスコア（−2〜+2で各要因を評価、NETで総合判定）

| 要因 | 逆風(−) | 追い風(+) |
|------|---------|----------|
| DXY強上昇 | −2 | — |
| DXY下落 | — | +1〜+2 |
| 米10年債上昇 | −2 | — |
| FRB利下げ期待後退 | −1 | — |
| 地政学リスク高 | — | +2 |
| 雇用悪化 | — | +1 |

NET ≥ +2 → 追い風優勢 / NET ≤ −2 → 逆風優勢 / その他 → 中立

### エントリー条件（3条件以上で候補成立）

**買い:** 4H/1H上昇 + 5080付近 + RSI≤32 + マクロNET>-3

**売り:** 1H/15M下降 + 5103〜5111付近 + DXY上昇 + マクロNET≤-1

---

## API接続方法（将来）

1. Alpha Vantage または Twelve Data のAPIキーを取得
2. `.env.local` に `NEXT_PUBLIC_USE_DUMMY_DATA=false` と APIキーを設定
3. `src/hooks/useMarketData.ts` の `fetchLiveData()` を実装するだけ

コンポーネント・ロジック関数の変更は不要です。

---

## LINE / Telegram 通知（将来）

`src/lib/notification.ts` の `formatForLine()` / `formatForTelegram()` 関数が実装済みです。
各APIへの送信関数を `src/lib/lineNotify.ts` / `src/lib/telegram.ts` として追加するだけで動作します。

---

## 今後の拡張案

- [ ] Phase 2: Alpha Vantage / Twelve Data 実データ接続
- [ ] Phase 3: EMA・RSI・MACD自動計算
- [ ] Phase 4: LINE / Telegram 通知実装
- [ ] Phase 5: バックテスト・シグナル履歴

---

## 技術スタック

Next.js 14 (App Router) + TypeScript + Tailwind CSS + React Hooks

---

## ライセンス

MIT
