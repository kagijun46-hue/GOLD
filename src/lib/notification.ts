// ===================================================================
// XAUUSD Trading Assistant - Notification Message Generation
// ===================================================================
// このファイルは通知メッセージの生成に特化しています。
// 将来的にLINE/Telegram APIに接続する際は、このファイルの関数を
// 呼び出してメッセージを生成し、各APIに送信する実装を追加してください。
//
// LINE実装例: src/lib/lineNotify.ts（将来実装）
// Telegram実装例: src/lib/telegram.ts（将来実装）
// ===================================================================

import type {
  NotificationCandidate,
  NotificationPriority,
  OverallJudgment,
  EntryCondition,
  MarketData,
  TimeframeTrend,
  MacroScore,
} from "@/types";
import { KEY_PRICE_LEVELS } from "@/data/dummy";
import { isPriceNear, isPriceInRange } from "./trend";

// ---------------------------------------------------------------
// 通知メッセージ生成（ルールベース）
// ---------------------------------------------------------------

/**
 * 現在の相場状況から通知候補リストを生成する
 *
 * 優先度:
 * HIGH   - 即時注意が必要な状況（ブレイクアウト、エントリー条件成立）
 * MEDIUM - 監視強化が必要な状況（重要レベル接近）
 * LOW    - 状況確認（様子見継続など）
 */
export function generateNotifications(
  judgment: OverallJudgment,
  marketData: MarketData,
  trends: TimeframeTrend[],
  entryConditions: EntryCondition[],
  macroScore: MacroScore
): NotificationCandidate[] {
  const notifications: NotificationCandidate[] = [];
  const price = marketData.xauusd.price;
  const now = new Date().toISOString();

  // -------------------------------------------------------
  // 1. 総合判定ステータス通知（常時表示）
  // -------------------------------------------------------
  notifications.push(
    buildNotification({
      id: "STATUS_OVERALL",
      priority: "LOW",
      title: "現在の相場ステータス",
      message: generateOverallStatusMessage(judgment, price),
      triggerCondition: "常時表示",
      isActive: true,
      timestamp: now,
    })
  );

  // -------------------------------------------------------
  // 2. 5050割れ警戒（HIGH優先度）
  // -------------------------------------------------------
  const isBelow5050 = price < KEY_PRICE_LEVELS.SUPPORT_LOW;
  const isNear5050 = isPriceNear(price, KEY_PRICE_LEVELS.SUPPORT_LOW, 0.3);

  if (isBelow5050) {
    notifications.push(
      buildNotification({
        id: "ALERT_BREAK_5050",
        priority: "HIGH",
        title: "【警戒】5050割れ確認",
        message: `5050を下抜け（現在: ${price.toFixed(2)}）。売り加速シグナル！次の目標5000〜4995。ポジション管理を即座に確認。`,
        triggerCondition: "5050割れ",
        isActive: true,
        timestamp: now,
      })
    );
  } else if (isNear5050) {
    notifications.push(
      buildNotification({
        id: "WATCH_5050",
        priority: "MEDIUM",
        title: "【監視】5050サポート接近",
        message: `価格が5050サポートに接近中（現在: ${price.toFixed(2)}）。5050割れで売り加速。5080反発なら買い注目。`,
        triggerCondition: "5050付近（±15ドル）",
        isActive: true,
        timestamp: now,
      })
    );
  }

  // -------------------------------------------------------
  // 3. 5160超え警戒（HIGH優先度）
  // -------------------------------------------------------
  const isAbove5160 = price > KEY_PRICE_LEVELS.RESISTANCE_HIGH;
  const isNear5160 = isPriceNear(price, KEY_PRICE_LEVELS.RESISTANCE_HIGH, 0.3);

  if (isAbove5160) {
    notifications.push(
      buildNotification({
        id: "ALERT_BREAK_5160",
        priority: "HIGH",
        title: "【速報】5160上抜けブレイクアウト",
        message: `5160を上抜け（現在: ${price.toFixed(2)}）。上昇加速シグナル！次の目標5200〜5240。押し目での買い参加を検討。`,
        triggerCondition: "5160超え",
        isActive: true,
        timestamp: now,
      })
    );
  } else if (isNear5160) {
    notifications.push(
      buildNotification({
        id: "WATCH_5160",
        priority: "MEDIUM",
        title: "【監視】5160レジスタンス接近",
        message: `価格が5160レジスタンスに接近中（現在: ${price.toFixed(2)}）。上抜けで買い加速。跳ね返りなら売り候補。`,
        triggerCondition: "5160付近（±15ドル）",
        isActive: true,
        timestamp: now,
      })
    );
  }

  // -------------------------------------------------------
  // 4. 5080付近の反発監視（MEDIUM）
  // -------------------------------------------------------
  const isNear5080 = isPriceNear(price, KEY_PRICE_LEVELS.SUPPORT_MAIN, 0.3);
  const m5Trend = trends.find((t) => t.timeframe === "M5");
  const rsiOversold = (m5Trend?.rsi ?? 50) <= 32;

  if (isNear5080) {
    const message =
      rsiOversold
        ? `5080サポート付近かつRSI売られすぎ（現在: ${price.toFixed(2)}、RSI: ${m5Trend?.rsi ?? "N/A"}）。1時間足陽線確定で買い候補。`
        : `5080サポート付近（現在: ${price.toFixed(2)}）。RSI反転待ちで買い監視継続。`;

    notifications.push(
      buildNotification({
        id: "WATCH_5080",
        priority: rsiOversold ? "MEDIUM" : "LOW",
        title: "【監視】5080サポート付近",
        message,
        triggerCondition: "5080付近（±15ドル）",
        isActive: true,
        timestamp: now,
      })
    );
  }

  // -------------------------------------------------------
  // 5. 5103〜5111レジスタンス反落監視（MEDIUM）
  // -------------------------------------------------------
  const isNearResistance = isPriceInRange(
    price,
    KEY_PRICE_LEVELS.RESISTANCE_MID_LOW - 8,
    KEY_PRICE_LEVELS.RESISTANCE_MID_HIGH + 8
  );

  if (isNearResistance) {
    notifications.push(
      buildNotification({
        id: "WATCH_RESISTANCE",
        priority: "MEDIUM",
        title: "【監視】5103〜5111レジスタンス付近",
        message: `価格がレジスタンス帯に接近（現在: ${price.toFixed(2)}）。${marketData.dxy.trend === "UP" ? "DXY上昇中 → " : ""}陰線確定で売り候補。ストップ5111超え。`,
        triggerCondition: "5103〜5111付近",
        isActive: true,
        timestamp: now,
      })
    );
  }

  // -------------------------------------------------------
  // 6. エントリー条件成立通知（HIGH）
  // -------------------------------------------------------
  entryConditions.forEach((entry) => {
    if (entry.isTriggered) {
      notifications.push(
        buildNotification({
          id: `ENTRY_${entry.id}`,
          priority: "HIGH",
          title: `【エントリー候補】${entry.title}`,
          message: generateEntryMessage(entry),
          triggerCondition: "エントリー条件3つ以上成立",
          isActive: true,
          timestamp: now,
        })
      );
    }
  });

  // -------------------------------------------------------
  // 7. マクロ逆風強化警告（MEDIUM）
  // -------------------------------------------------------
  if (macroScore.net <= -4) {
    notifications.push(
      buildNotification({
        id: "MACRO_EXTREME_HEADWIND",
        priority: "MEDIUM",
        title: "【注意】マクロ逆風が極端に強い",
        message: `DXY・利回り上昇が重なりゴールドへの逆風スコアが${macroScore.headwind}。買いポジションは慎重に。`,
        triggerCondition: "マクロ逆風スコア4以上",
        isActive: true,
        timestamp: now,
      })
    );
  }

  // 重複を除いてソート（HIGH → MEDIUM → LOW）
  return sortNotificationsByPriority(notifications);
}

// ---------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------

function buildNotification(
  params: NotificationCandidate
): NotificationCandidate {
  return params;
}

function generateOverallStatusMessage(
  judgment: OverallJudgment,
  price: number
): string {
  switch (judgment) {
    case "BULL":
      return `現在は買い優勢。現在価格${price.toFixed(2)}。エントリー条件成立を待ちつつ押し目を狙う段階。`;
    case "BEAR":
      return `現在は売り優勢。現在価格${price.toFixed(2)}。レジスタンスでの反落確認を待つ段階。`;
    case "WAIT":
    default:
      return `現在は様子見。日足上昇と短期下降が対立。5080〜5160の決着待ち。価格: ${price.toFixed(2)}。`;
  }
}

function generateEntryMessage(entry: EntryCondition): string {
  if (entry.side === "BUY") {
    return `買い候補条件が揃いました。ターゲット: ${entry.target}、ストップ: ${entry.stopLoss}、${entry.riskReward}。1時間足陽線確定でエントリー検討。`;
  } else {
    return `売り候補条件が揃いました。ターゲット: ${entry.target}、ストップ: ${entry.stopLoss}、${entry.riskReward}。陰線確定でエントリー検討。`;
  }
}

function sortNotificationsByPriority(
  notifications: NotificationCandidate[]
): NotificationCandidate[] {
  const priorityOrder: Record<NotificationPriority, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  return [...notifications].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

// ---------------------------------------------------------------
// 将来: LINE通知用フォーマット変換
// ---------------------------------------------------------------

/**
 * NotificationCandidate をLINE Notifyに送信する文字列に変換する
 * 将来 src/lib/lineNotify.ts で使用する
 */
export function formatForLine(notification: NotificationCandidate): string {
  const priorityEmoji =
    notification.priority === "HIGH"
      ? "🚨"
      : notification.priority === "MEDIUM"
      ? "⚠️"
      : "ℹ️";

  return [
    `${priorityEmoji} ${notification.title}`,
    "",
    notification.message,
    "",
    `📊 XAUUSD Trading Assistant`,
    `🕐 ${new Date(notification.timestamp).toLocaleString("ja-JP")}`,
  ].join("\n");
}

/**
 * NotificationCandidate をTelegram Bot Messageに変換する
 * 将来 src/lib/telegram.ts で使用する
 */
export function formatForTelegram(notification: NotificationCandidate): string {
  const priorityEmoji =
    notification.priority === "HIGH"
      ? "🚨"
      : notification.priority === "MEDIUM"
      ? "⚠️"
      : "ℹ️";

  return [
    `*${priorityEmoji} ${notification.title}*`,
    "",
    notification.message,
    "",
    `_XAUUSD Trading Assistant_`,
    `_${new Date(notification.timestamp).toLocaleString("ja-JP")}_`,
  ].join("\n");
}
