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
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Problem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            リモートワークの
            <span className="text-gray-400">見えない壁</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            オンラインでつながっているはずなのに、どこか距離を感じる。そんなご経験はありませんか？
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-sky-50 transition-colors duration-300">
                <problem.Icon className="w-6 h-6 text-gray-400 group-hover:text-sky-500 transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
