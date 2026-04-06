'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { EyeOff, MessageSquareOff, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const problems: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: EyeOff,
    title: 'メンバーの状況がわからない',
    description: 'チャットツールのステータスだけでは、チームの今の様子が伝わりません。気づけば孤立感が募ってしまいます。',
  },
  {
    Icon: MessageSquareOff,
    title: '気軽に話しかけにくい',
    description: 'ちょっとした相談のたびに、わざわざ会議を設定するのは手間がかかります。',
  },
  {
    Icon: Users,
    title: 'チームの一体感が薄れてしまう',
    description: '隣の席に仲間がいない環境では、自然な雑談が生まれず、チームのつながりが弱まってしまいます。',
  },
];

export default function ProblemSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left column — sticky heading */}
          <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              リモートワークの
              <span className="text-text-tertiary">見えない壁</span>
            </h2>
            <p className="text-text-secondary max-w-md">
              オンラインでつながっているはずなのに、どこか距離を感じる。そんなご経験はありませんか？
            </p>
          </div>

          {/* Right column — stacked problem cards */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {problems.map((problem, i) => (
              <div
                key={i}
                className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300"
              >
                <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-8">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <problem.Icon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">{problem.title}</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{problem.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
