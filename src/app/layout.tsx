import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ethereal Office - チームの距離を、ゼロにする",
  description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。30秒でオフィスを作成し、チームとリアルタイムでつながろう。",
  keywords: ["バーチャルオフィス", "リモートワーク", "オンラインオフィス", "チームコミュニケーション", "virtual office"],
  openGraph: {
    title: "Ethereal Office - チームの距離を、ゼロにする",
    description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。",
    type: "website",
    locale: "ja_JP",
    siteName: "Ethereal Office",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereal Office - チームの距離を、ゼロにする",
    description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
