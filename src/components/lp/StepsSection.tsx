'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  {
    number: '01',
    title: 'フロアを作成',
    description:
      'フロア名を入力するだけで、すぐにオフィスが完成します。所要時間はわずか30秒です。',
  },
  {
    number: '02',
    title: 'URLをシェア',
    description:
      '作成されたURLをチームに共有してください。アカウント登録は一切必要ありません。',
  },
  {
    number: '03',
    title: 'オフィスに集合',
    description:
      'チームのメンバーが自然と集まり、いつでも気軽にコミュニケーションが取れるようになります。',
  },
];

export default function StepsSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal py-16 sm:py-24 px-4 bg-surface">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-accent">3ステップ</span>
            <span className="text-text-primary">で始められる</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            難しい設定は一切ありません。どなたでもすぐにお使いいただけます。
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-6"
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Left side: number circle + connecting line */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-accent text-zinc-950 font-bold text-lg flex items-center justify-center shrink-0">
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px h-20 bg-zinc-200 dark:bg-zinc-800 mt-2" />
                )}
              </div>

              {/* Right side: content */}
              <div className="pb-16">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
