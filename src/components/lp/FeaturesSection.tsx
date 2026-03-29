'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
    title: 'リアルタイムプレゼンス',
    description: '誰がオフィスにいて、今何をしているのかが一目でわかる。チームの"今"を可視化。',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4" />
      </svg>
    ),
    title: 'ワンクリック会話',
    description: 'アバターに近づくだけで自然に会話開始。ミーティング設定は不要。',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: 'カスタマイズ可能なオフィス',
    description: '会議室、ラウンジ、デスク配置を自由に設計。チームに合ったオフィスを作れる。',
    color: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'ログイン不要・30秒で開始',
    description: 'アカウント登録は一切不要。URLを開くだけで即参加。フロア作成も30秒で完了。',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/10',
  },
];

export default function FeaturesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="features" ref={ref} className="scroll-reveal relative py-24 sm:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm tracking-wider uppercase mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            チームが自然とつながる
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">機能</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            シンプルだけど、リモートワークに本当に必要なものを。
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-5`}>
                <div className={`bg-gradient-to-br ${feature.color} bg-clip-text`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>

              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
