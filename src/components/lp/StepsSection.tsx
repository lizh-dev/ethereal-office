'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  {
    number: '01',
    title: 'フロアを作成',
    description: 'フロア名を入力するだけで、すぐにオフィスが完成します。所要時間はわずか30秒です。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'URLをシェア',
    description: '作成されたURLをチームに共有してください。アカウント登録は一切必要ありません。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'オフィスに集合',
    description: 'チームのメンバーが自然と集まり、いつでも気軽にコミュニケーションが取れるようになります。',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export default function StepsSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-sky-50/50">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">3ステップ</span>
            で始められる
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            難しい設定は一切ありません。どなたでもすぐにお使いいただけます。
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent -translate-y-1/2" />

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative text-center group"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Step circle */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-sky-200 shadow-sm mb-6 group-hover:scale-110 group-hover:border-sky-300 group-hover:shadow-md transition-all duration-500">
                  <div className="text-sky-500 group-hover:text-sky-400 transition-colors duration-300">
                    {step.icon}
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
