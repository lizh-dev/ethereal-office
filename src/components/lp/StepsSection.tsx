'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Plus, Link, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const steps: { number: string; title: string; description: string; Icon: LucideIcon }[] = [
  {
    number: '01',
    title: 'フロアを作成',
    description: 'フロア名を入力するだけで、すぐにオフィスが完成します。所要時間はわずか30秒です。',
    Icon: Plus,
  },
  {
    number: '02',
    title: 'URLをシェア',
    description: '作成されたURLをチームに共有してください。アカウント登録は一切必要ありません。',
    Icon: Link,
  },
  {
    number: '03',
    title: 'オフィスに集合',
    description: 'チームのメンバーが自然と集まり、いつでも気軽にコミュニケーションが取れるようになります。',
    Icon: Users,
  },
];

export default function StepsSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-sky-50/50">
      <div className="max-w-5xl mx-auto">
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

        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent -translate-y-1/2" />

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative text-center group"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-sky-200 shadow-sm mb-6 group-hover:scale-110 group-hover:border-sky-300 group-hover:shadow-md transition-all duration-500">
                  <step.Icon className="w-8 h-8 text-sky-500 group-hover:text-sky-400 transition-colors duration-300" strokeWidth={1.5} />
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
