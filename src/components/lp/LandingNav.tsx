'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface LandingNavProps {
  onCtaClick: () => void;
}

export default function LandingNav({ onCtaClick }: LandingNavProps) {
  const { toggle, isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl">
      <div
        className={`
          backdrop-blur-xl rounded-full px-5 py-2.5
          flex items-center justify-between
          transition-all duration-300
          bg-white/70 border border-zinc-200/80
          dark:bg-zinc-900/70 dark:border-zinc-700/50
          ${scrolled ? 'shadow-lg' : 'shadow-none'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-text-primary">SmartOffice</span>
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">機能</a>
          <a href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">料金</a>
          <a href="#faq" className="text-text-secondary hover:text-text-primary transition-colors">FAQ</a>
        </div>

        {/* Right: Theme toggle + CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="テーマ切替"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onCtaClick}
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold text-sm rounded-full transition-all duration-200 hover:scale-[1.03]"
          >
            無料で始める
          </button>
        </div>
      </div>
    </nav>
  );
}
