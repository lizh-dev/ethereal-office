'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const features = [
  {
    icon: '🎙️',
    title: '近接ボイス',
    description: '近くにいる方の声が自然に聞こえ、離れると小さくなります。本物のオフィスのような音声体験です。',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    tag: 'NEW',
  },
  {
    icon: '💺',
    title: '座るだけで自動通話',
    description: '同じエリアに着席した瞬間に、自動で音声がつながります。会議の設定やクリックの手間はありません。',
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    tag: 'NEW',
  },
  {
    icon: '🖥️',
    title: '画面共有',
    description: '通話中にワンクリックで画面を共有できます。離れた場所でも、一緒に画面を見ながらお仕事が進められます。',
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    tag: 'NEW',
  },
  {
    icon: '🎯',
    title: '集中タイマー',
    description: 'タイマーを使うと「取込中」のステータスが自動で表示されます。声をかけてよいタイミングがチームに伝わります。',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    tag: 'NEW',
  },
  {
    icon: '🏢',
    title: 'カスタムオフィス',
    description: 'デスク・会議室・ラウンジ・カフェを自由に配置できます。ガイドに沿って進めるだけで、30秒で完成します。',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: '⚡',
    title: 'ログイン不要・30秒',
    description: 'アカウント登録は一切不要です。URLを共有するだけで、チームの全員がすぐに参加できます。',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
];

export default function FeaturesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="features" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            チームが自然とつながる
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">機能</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            アカウント登録なしで、すぐにお使いいただけます。
          </p>
        </div>

        {/* Feature cards — 3 columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-7 rounded-2xl bg-white border border-gray-100 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-50 transition-all duration-500"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {feature.tag && (
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-sky-500 text-white text-[9px] font-bold rounded-full tracking-wider">
                  {feature.tag}
                </span>
              )}
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${feature.bgColor} mb-4`}>
                <span className="text-xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
