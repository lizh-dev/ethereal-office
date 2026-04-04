'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { OfficeMockup, MeetingMockup, ChatMockup } from './ProductMockup';
import { Building2, MessageCircle, Video, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const tabs: { id: string; label: string; Icon: LucideIcon; description: string; highlights: string[] }[] = [
  {
    id: 'office',
    label: 'バーチャルオフィス',
    Icon: Building2,
    description: 'チーム全員の居場所とステータスがひと目で確認できます。座席をクリックするだけで着席でき、誰がどこで何をしているかがリアルタイムでわかります。',
    highlights: ['メンバーの在席状況をリアルタイム表示', 'ワンクリックで着席', 'ステータスの自動表示'],
  },
  {
    id: 'chat',
    label: 'チャット・DM',
    Icon: MessageCircle,
    description: 'フロア全体のチャットと個別のダイレクトメッセージ。テキストでのコミュニケーションもしっかり対応しています。',
    highlights: ['フロア全体チャットと個別DM', '未読バッジでメッセージを見逃さない', '会話データはサーバーに保存しません'],
  },
  {
    id: 'meeting',
    label: 'ビデオ会議',
    Icon: Video,
    description: 'フロアからワンクリックでミーティングを開始。ビデオ通話・画面共有・ホワイトボードに対応し、1:1通話もメンバーリストから直接発信できます。',
    highlights: ['ワンクリックでミーティング開始', 'ビデオ通話・画面共有・ホワイトボード', '1:1通話にも対応'],
  },
];

export default function ScreenshotSection() {
  const ref = useScrollReveal<HTMLElement>();
  const [active, setActive] = useState(0);
  const ActiveIcon = tabs[active].Icon;

  return (
    <section ref={ref} className="scroll-reveal relative py-20 sm:py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/80 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-100/30 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Product</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            実際の<span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">画面</span>を見てみよう
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            30秒で作成できるバーチャルオフィスの機能をご紹介します
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-gray-100 rounded-2xl p-1.5 gap-1">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active === i
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.Icon className="w-4 h-4" strokeWidth={1.8} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 rounded-full border border-sky-100 text-sky-600 text-xs font-medium mb-4">
              <ActiveIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {tabs[active].label}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {tabs[active].label}
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6 text-base">
              {tabs[active].description}
            </p>

            <ul className="space-y-3 mb-8">
              {tabs[active].highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-sky-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm text-gray-700">{h}</span>
                </li>
              ))}
            </ul>

            <a
              href="#create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-sky-200 hover:scale-105"
            >
              無料で試す
              <span>&rarr;</span>
            </a>
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-sky-200/30 via-blue-100/20 to-indigo-200/30 rounded-3xl blur-2xl -z-10" />
              {/* モバイル: スケール縮小で表示、デスクトップ: そのまま */}
              <div className="relative w-full" style={{ aspectRatio: active === 0 ? '16/12' : '16/10' }}>
                <div className="absolute inset-0 origin-top-left" style={{ width: '160%', transform: 'scale(0.625)' }}>
                  <div className="lg:hidden">
                    <div className={active === 0 ? 'block' : 'hidden'}><OfficeMockup /></div>
                    <div className={active === 1 ? 'block' : 'hidden'}><ChatMockup /></div>
                    <div className={active === 2 ? 'block' : 'hidden'}><MeetingMockup /></div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className={active === 0 ? 'block' : 'hidden'}><OfficeMockup /></div>
                  <div className={active === 1 ? 'block' : 'hidden'}><ChatMockup /></div>
                  <div className={active === 2 ? 'block' : 'hidden'}><MeetingMockup /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
