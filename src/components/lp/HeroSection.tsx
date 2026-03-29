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
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-blob-1" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] animate-blob-3" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          無料で使えるバーチャルオフィス
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
          <span className="text-white">チームの距離を、</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ゼロにする。
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ログイン不要、URLを共有するだけ。
          <br className="hidden sm:block" />
          リモートチームが自然につながるバーチャルオフィス。
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onCtaClick}
            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:scale-105"
          >
            無料で始める
            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
          <a
            href="#features"
            className="px-8 py-4 text-gray-400 hover:text-white font-medium text-lg transition-colors duration-300"
          >
            機能を見る
          </a>
        </div>

        {/* Stylized office visual */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
            {/* Mock office floor */}
            <div className="grid grid-cols-4 gap-3">
              {/* Desk area */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center animate-desk-pop"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-6 h-6 rounded-full ${i < 5 ? 'bg-gradient-to-br from-indigo-400 to-purple-400' : 'bg-white/5'} flex items-center justify-center`}>
                    {i < 5 && (
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Status bar */}
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                5人がオンライン
              </span>
              <span className="w-px h-3 bg-gray-700" />
              <span>開発チームのオフィス</span>
            </div>
          </div>
          {/* Glow effect behind the card */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl -z-10" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-bounce-slow">
        <span className="text-xs">Scroll</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-50">
          <path d="M10 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
