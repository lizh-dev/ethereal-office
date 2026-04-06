import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartOffice - チームの距離を、ゼロにする",
  description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。30秒でオフィスを作成し、チームとリアルタイムでつながろう。",
  keywords: ["バーチャルオフィス", "リモートワーク", "オンラインオフィス", "チームコミュニケーション", "virtual office"],
  openGraph: {
    title: "SmartOffice - チームの距離を、ゼロにする",
    description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。",
    type: "website",
    locale: "ja_JP",
    siteName: "SmartOffice",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartOffice - チームの距離を、ゼロにする",
    description: "ログイン不要、URLを共有するだけ。リモートチームが自然につながるバーチャルオフィス。",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('smartoffice-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
