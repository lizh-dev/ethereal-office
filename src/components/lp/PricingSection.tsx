'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '永久無料',
    description: '今すぐお使いいただけます',
    features: [
      'フロア作成 無制限',
      '同時接続 10人まで',
      'チャット・ダイレクトメッセージ',
      'フロアエディター（自由配置）',
      'アバターカスタマイズ',
      'パスワード保護',
    ],
    cta: '無料で始める',
    highlighted: true,
    badge: 'おすすめ',
  },
  {
    name: 'Pro',
    price: '980',
    period: '/月',
    description: 'すべての機能を解放',
    features: [
      'Freeプランの全機能',
      '同時接続 無制限',
      '音声・ビデオ通話',
      '画面共有',
      'ファイル共有',
      '共有ホワイトボード',
      'メンバー管理',
      'カスタムブランディング',
      'SSO対応',
      'APIアクセス',
      '優先サポート・SLA保証',
    ],
    cta: 'Proプランを始める',
    highlighted: false,
  },
];

export default function PricingSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="pricing" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            シンプルな<span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">料金体系</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            現在はすべての基本機能を無料でご利用いただけます
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                <span className="text-4xl font-extrabold text-gray-900">¥{plan.price}</span>
                <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#create"
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
      </div>
    </section>
  );
}
