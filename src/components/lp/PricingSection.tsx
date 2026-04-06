'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '永久無料',
    description: '主要機能はすべて無料',
    features: [
      'フロア 1つ',
      '同時接続 10人まで',
      'ビデオ会議・画面共有（4人 / 同時1会議）',
      '共有ボード 1つ',
      'チャット・DM',
      'フロアエディター（自由配置）',
      '集中タイマー・ステータス共有',
      'パスワード保護',
    ],
    cta: '無料で始める',
    ctaHref: '#create',
    highlighted: true,
    badge: 'おすすめ',
  },
  {
    name: 'Pro',
    price: '980',
    period: '/月',
    description: '大規模チーム向け',
    features: [
      'Freeプランの全機能',
      'フロア 無制限',
      '同時接続 無制限',
      '会議参加者・同時会議 無制限',
      '共有ボード 無制限',
      'ミーティング内ボード',
      'プレミアム家具テーマ（5種）',
      'フロアテンプレート（100種）',
      'カスタムブランディング',
    ],
    cta: 'Proプランを始める',
    ctaHref: '#create',
    highlighted: false,
  },
  {
    name: 'Self-Hosted',
    price: 'お問い合わせ',
    period: '',
    description: '自社環境でデータを完全管理',
    features: [
      'Proプランの全機能',
      'お客様のインフラで運用',
      'チャット・DM履歴の永続化',
      'データの完全な自社管理',
      '導入・運用サポート',
    ],
    cta: 'お問い合わせ',
    ctaHref: 'mailto:contact@smartoffice.app',
    highlighted: false,
  },
];

export default function PricingSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="pricing" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            シンプルな<span className="text-accent">料金体系</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            主要機能はすべて無料。チームの規模に合わせてお選びください
          </p>
        </div>

        {/* Plan cards - 2 columns */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white dark:bg-zinc-900 border-2 border-amber-400 dark:border-amber-500 shadow-lg'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md'
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-zinc-950 text-xs font-semibold rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-1">{plan.name}</h3>
                <p className="text-xs text-text-secondary">{plan.description}</p>
              </div>
              <div className="mb-6">
                {plan.price === 'お問い合わせ' ? (
                  <span className="text-2xl font-extrabold text-text-primary">{plan.price}</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-text-primary">&yen;{plan.price}</span>
                    <span className="text-sm text-text-secondary ml-1">{plan.period}</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={plan.ctaHref}
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-accent hover:bg-accent-hover text-zinc-950 shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
