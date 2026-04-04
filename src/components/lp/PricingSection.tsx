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
      'ビデオ会議・画面共有（4人まで / 同時1会議）',
      '共有ボード 1つ',
      'チャット・DM',
      'フロアエディター（自由配置）',
      '集中タイマー・ステータス共有',
      'アバターカスタマイズ',
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
    description: '大規模チーム・企業向け',
    features: [
      'Freeプランの全機能',
      'フロア 無制限',
      '同時接続 無制限',
      '会議参加者 無制限',
      '同時ミーティング 無制限',
      '共有ボード 無制限',
      'ミーティング内ボード',
      'プレミアム家具テーマ（5種）',
      'ファイル共有',
      'フロアテンプレート',
      'カスタムブランディング',
      '優先サポート',
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
      'SSO対応',
      'APIアクセス',
      'データの完全な自社管理',
      '導入・運用サポート',
    ],
    cta: 'お問い合わせ',
    ctaHref: 'mailto:contact@smartoffice.app',
    highlighted: false,
  },
];

const checkIcon = (
  <svg className="w-5 h-5 text-sky-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const dash = <span className="text-gray-300">&mdash;</span>;

const comparisonRows: { feature: string; free: string | boolean; pro: string | boolean; self: string | boolean }[] = [
  { feature: 'フロア作成', free: '1つ', pro: '無制限', self: '無制限' },
  { feature: '同時接続', free: '10人', pro: '無制限', self: '無制限' },
  { feature: '会議参加者', free: '4人', pro: '無制限', self: '無制限' },
  { feature: '同時ミーティング', free: '1', pro: '無制限', self: '無制限' },
  { feature: 'ビデオ会議・画面共有', free: true, pro: true, self: true },
  { feature: '共有ボード', free: '1つ', pro: '無制限', self: '無制限' },
  { feature: 'チャット・DM', free: true, pro: true, self: true },
  { feature: 'チャット履歴の保存', free: false, pro: false, self: true },
  { feature: '集中タイマー', free: true, pro: true, self: true },
  { feature: 'フロアエディター', free: true, pro: true, self: true },
  { feature: 'アバターカスタマイズ', free: true, pro: true, self: true },
  { feature: 'パスワード保護', free: true, pro: true, self: true },
  { feature: 'ファイル共有', free: false, pro: true, self: true },
  { feature: 'ミーティング内ボード', free: false, pro: true, self: true },
  { feature: 'プレミアム家具テーマ', free: false, pro: true, self: true },
  { feature: 'フロアテンプレート', free: false, pro: true, self: true },
  { feature: 'カスタムブランディング', free: false, pro: true, self: true },
  { feature: 'SSO', free: false, pro: false, self: true },
  { feature: 'APIアクセス', free: false, pro: false, self: true },
  { feature: '自社インフラ運用', free: false, pro: false, self: true },
  { feature: '優先サポート', free: false, pro: true, self: true },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'string') return <span className="text-gray-700 font-medium">{value}</span>;
  return value ? checkIcon : dash;
}

export default function PricingSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="pricing" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            シンプルな<span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">料金体系</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            主要機能はすべて無料。チームの規模に合わせてお選びください
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white border-2 border-sky-400 shadow-xl shadow-sky-100 scale-[1.02]'
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-sky-500 text-white text-xs font-semibold rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>
              <div className="mb-6">
                {plan.price === 'お問い合わせ' ? (
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-gray-900">&yen;{plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={plan.ctaHref}
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-14 max-w-5xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-6">機能比較</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 pr-4 font-medium text-gray-500">機能</th>
                  <th className="text-center py-3 px-3 font-semibold text-sky-600 w-[18%]">Free</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-700 w-[18%]">Pro</th>
                  <th className="text-center py-3 pl-3 font-semibold text-gray-700 w-[18%]">Self-Hosted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50/50">
                    <td className="py-3 pr-4 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-3 text-center"><CellValue value={row.free} /></td>
                    <td className="py-3 px-3 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-3 pl-3 text-center"><CellValue value={row.self} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
