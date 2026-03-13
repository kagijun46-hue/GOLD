import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XAUUSD Trading Assistant | ゴールド相場監視",
  description:
    "XAUUSD（ゴールド）の相場環境を自動分析。環境認識・エントリー補助・通知候補を表示するトレーダー向けダッシュボード。",
  keywords: ["XAUUSD", "ゴールド", "金", "トレード", "相場分析", "FX"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-chart-bg text-chart-text antialiased">
        {children}
      </body>
    </html>
  );
}
