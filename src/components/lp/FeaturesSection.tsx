'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Video, MessageCircle, Timer, PenTool, LayoutDashboard, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const features: { Icon: LucideIcon; title: string; description: string; color: string; bgColor: string }[] = [
  {
    Icon: Video,
    title: 'ビデオ会議・画面共有',
    description: 'ワンクリックでミーティングを開始。ビデオ通話・画面共有・チャットが使えます。1:1通話もメンバーリストからすぐに発信できます。',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
  {
    Icon: MessageCircle,
    title: 'チャット・DM',
    description: 'フロア全体のチャットと、個別のダイレクトメッセージ。テキストでのコミュニケーションもしっかり対応しています。',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    Icon: Timer,
    title: '集中タイマー',
    description: 'タイマーを使うと「取込中」のステータスが自動で表示されます。声をかけてよいタイミングがチームに伝わります。',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    Icon: PenTool,
    title: '共有ホワイトボード',
    description: 'ミーティング中にリアルタイムで共同編集できるホワイトボード。図形・テキスト・フリーハンドで自由に書き込めます。',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    Icon: LayoutDashboard,
    title: 'カスタムオフィス',
    description: 'デスク・会議室・ラウンジ・カフェを自由に配置できます。ガイドに沿って進めるだけで、30秒で完成します。',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    Icon: Zap,
    title: 'ログイン不要・30秒',
    description: 'アカウント登録は一切不要です。URLを共有するだけで、チームの全員がすぐに参加できます。',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
];

export default function FeaturesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="features" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            チームが自然とつながる
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">機能</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            すべて無料。アカウント登録なしで、すぐにお使いいただけます。
          </p>
        </div>

        {/* Feature cards — 3 columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-7 rounded-2xl bg-white border border-gray-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-500"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${feature.bgColor} mb-4`}>
                <feature.Icon className={`w-5 h-5 ${feature.color}`} strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
