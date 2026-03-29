'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="scroll-reveal relative min-h-screen flex items-center justify-center overflow-hidden px-4"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-200/40 blur-[120px] animate-blob-1" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200/30 blur-[120px] animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sky-100/40 blur-[100px] animate-blob-3" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,100,200,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,200,.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sm text-sky-600 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          無料で使えるバーチャルオフィス
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          <span className="text-gray-900">チームの距離を、</span>
          <br />
          <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            ゼロにする。
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          ログイン不要、URLを共有するだけ。
          <br className="hidden sm:block" />
          リモートチームが自然につながるバーチャルオフィス。
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onCtaClick}
            className="group relative px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(14,165,233,0.3)] hover:scale-105"
          >
            無料で始める
            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
          <a
            href="#features"
            className="px-8 py-4 text-gray-400 hover:text-gray-700 font-medium text-lg transition-colors duration-300"
          >
            機能を見る
          </a>
        </div>

        {/* Stylized office visual */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-2xl rounded-2xl border border-sky-100 bg-white/80 backdrop-blur-sm p-6 shadow-xl shadow-sky-100/50">
            {/* Mock office floor */}
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 flex items-center justify-center animate-desk-pop"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-6 h-6 rounded-full ${i < 5 ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gray-100'} flex items-center justify-center`}>
                    {i < 5 && (
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Status bar */}
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                5人がオンライン
              </span>
              <span className="w-px h-3 bg-gray-200" />
              <span>開発チームのオフィス</span>
            </div>
          </div>
          {/* Glow effect behind the card */}
          <div className="absolute -inset-4 bg-gradient-to-r from-sky-200/20 via-blue-200/20 to-sky-200/20 rounded-3xl blur-xl -z-10" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce-slow">
        <span className="text-xs">Scroll</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-50">
          <path d="M10 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
