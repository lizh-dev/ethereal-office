'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const problems = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 15s1.5-2 4-2 4 2 4 2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    title: 'メンバーの状況がわからない',
    description: 'チャットツールのステータスだけでは、チームの今の様子が伝わりません。気づけば孤立感が募ってしまいます。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </svg>
    ),
    title: '気軽に話しかけにくい',
    description: 'ちょっとした相談のたびに、わざわざ会議を設定するのは手間がかかります。',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'チームの一体感が薄れてしまう',
    description: '隣の席に仲間がいない環境では、自然な雑談が生まれず、チームのつながりが弱まってしまいます。',
  },
];

export default function ProblemSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
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

        {/* Problem cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-sky-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                {problem.icon}
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
