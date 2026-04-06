'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// Interactive network canvas - nodes attracted to mouse, representing "つながり"
function InteractiveNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodeCount = 35;
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      radius: 2 + Math.random() * 3,
      pulse: Math.random() * Math.PI * 2,
      active: i < 25,
    }));

    const isDark = () => document.documentElement.classList.contains('dark');
    const accentR = 245, accentG = 158, accentB = 11;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dark = isDark();

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;

        if (mx > 0 && mx < 100 && my > 0 && my < 100) {
          const dx = mx - node.x;
          const dy = my - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 25 && dist > 0) {
            const force = (1 - dist / 25) * 0.15;
            node.x += dx * force * 0.05;
            node.y += dy * force * 0.05;
          }
        }

        if (node.x < 2 || node.x > 98) node.vx *= -1;
        if (node.y < 2 || node.y > 98) node.vy *= -1;
        node.x = Math.max(1, Math.min(99, node.x));
        node.y = Math.max(1, Math.min(99, node.y));
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (!a.active || !b.active) continue;
          const dx = (a.x - b.x) * w / 100;
          const dy = (a.y - b.y) * h / 100;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w * 0.18;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist);
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const mouseDist = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
            const nearMouse = mouseDist < 20;
            if (nearMouse) {
              ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha * 0.3})`;
              ctx.lineWidth = 1;
            } else {
              const la = alpha * (dark ? 0.08 : 0.06);
              ctx.strokeStyle = dark ? `rgba(161,161,170,${la})` : `rgba(113,113,122,${la})`;
              ctx.lineWidth = 0.5;
            }
            ctx.beginPath();
            ctx.moveTo(a.x * w / 100, a.y * h / 100);
            ctx.lineTo(b.x * w / 100, b.y * h / 100);
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        const nx = node.x * w / 100;
        const ny = node.y * h / 100;
        const ps = node.active ? 1 + Math.sin(node.pulse) * 0.1 : 1;
        const md = Math.sqrt((node.x - mx) ** 2 + (node.y - my) ** 2);
        const near = md < 15;

        if (node.active && near) {
          const gr = node.radius * 4 * ps;
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, gr);
          glow.addColorStop(0, `rgba(${accentR},${accentG},${accentB},0.15)`);
          glow.addColorStop(1, `rgba(${accentR},${accentG},${accentB},0)`);
          ctx.beginPath(); ctx.arc(nx, ny, gr, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, node.radius * ps * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},0.7)`; ctx.fill();
        } else if (node.active) {
          const gc = dark ? '161,161,170' : '113,113,122';
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.radius * 2.5 * ps);
          glow.addColorStop(0, `rgba(${gc},0.05)`); glow.addColorStop(1, `rgba(${gc},0)`);
          ctx.beginPath(); ctx.arc(nx, ny, node.radius * 2.5 * ps, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
          ctx.beginPath(); ctx.arc(nx, ny, node.radius * ps, 0, Math.PI * 2);
          ctx.fillStyle = dark ? `rgba(161,161,170,0.25)` : `rgba(113,113,122,0.2)`; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(nx, ny, node.radius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = dark ? `rgba(82,82,91,0.15)` : `rgba(161,161,170,0.12)`; ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    const section = canvas.parentElement;
    section?.addEventListener('mousemove', handleMouseMove);
    section?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      section?.removeEventListener('mousemove', handleMouseMove);
      section?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="scroll-reveal relative overflow-hidden px-4 pt-36 sm:pt-40 pb-16 sm:pb-24 lg:min-h-[85vh] lg:flex lg:items-center bg-background"
    >
      <InteractiveNetwork />

      {/* Subtle amber radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-amber-600 dark:text-amber-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          参加者はアカウント登録不要
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
          <span className="text-text-primary">チームの距離を、</span>
          <br />
          <span className="text-amber-500">ゼロにする。</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          URLを共有するだけで、チームのみなさまが
          <br className="hidden sm:block" />
          すぐにつながれるバーチャルオフィスです。
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={onCtaClick}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-zinc-950 font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            無料でオフィスを作る
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a
            href="#features"
            className="px-6 py-4 text-text-secondary hover:text-text-primary font-medium transition-colors duration-300"
          >
            機能を見る
          </a>
        </div>

        {/* Key numbers - horizontal */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">30秒</div>
            <div className="text-xs text-text-tertiary mt-1">でオフィス開設</div>
          </div>
          <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">0円</div>
            <div className="text-xs text-text-tertiary mt-1">主要機能すべて無料</div>
          </div>
          <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">URL共有</div>
            <div className="text-xs text-text-tertiary mt-1">だけでチーム参加</div>
          </div>
        </div>
      </div>
    </section>
  );
}
