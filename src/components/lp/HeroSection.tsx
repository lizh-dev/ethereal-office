'use client';

import { useEffect, useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// Full-screen animated network canvas - people connecting
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    const nodes = Array.from({ length: 15 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      radius: 3 + Math.random() * 3,
      lightness: 75 + Math.random() * 15,
      online: i < 10,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.015;
        if (node.x < 3 || node.x > 97) node.vx *= -1;
        if (node.y < 3 || node.y > 97) node.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * w / 100;
          const dy = (a.y - b.y) * h / 100;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w * 0.22;
          if (dist < maxDist && a.online && b.online) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(a.x * w / 100, a.y * h / 100);
            ctx.lineTo(b.x * w / 100, b.y * h / 100);
            ctx.strokeStyle = `rgba(180, 180, 190, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        const nx = node.x * w / 100;
        const ny = node.y * h / 100;
        const pulseScale = node.online ? 1 + Math.sin(node.pulse) * 0.08 : 1;

        if (node.online) {
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.radius * 2.5 * pulseScale);
          glow.addColorStop(0, `rgba(200, 200, 210, 0.06)`);
          glow.addColorStop(1, `rgba(200, 200, 210, 0)`);
          ctx.beginPath();
          ctx.arc(nx, ny, node.radius * 2.5 * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(nx, ny, node.radius * pulseScale, 0, Math.PI * 2);
        const l = node.lightness;
        ctx.fillStyle = node.online
          ? `hsla(220, 5%, ${l}%, 0.4)`
          : `hsla(220, 3%, ${l + 5}%, 0.15)`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
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
      className="scroll-reveal relative overflow-hidden px-4 pt-24 pb-12"
    >
      {/* Full-screen network animation as background */}
      <NetworkCanvas />

      {/* Soft gradient blobs behind */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-200/30 blur-[120px] animate-blob-1" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-[120px] animate-blob-2" />
      </div>

      {/* Content on top */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-sky-200 text-sm text-sky-600 mb-8">
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
            アカウント登録は不要です。URLを共有するだけで、
            <br className="hidden sm:block" />
            チームのみなさまがすぐにつながれるバーチャルオフィスです。
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
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

          {/* Stats / social proof */}
          <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12 mb-14">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">30秒</div>
              <div className="text-xs text-gray-400 mt-1">でオフィス開設</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">0円</div>
              <div className="text-xs text-gray-400 mt-1">完全無料</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">登録不要</div>
              <div className="text-xs text-gray-400 mt-1">URL共有のみ</div>
            </div>
          </div>

          {/* Demo video */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-br from-sky-200/40 via-blue-200/30 to-indigo-200/40 rounded-3xl blur-2xl" />
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200/60">
              <div className="h-9 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-1.5 px-4 py-1 bg-white rounded-md border border-gray-200 text-[11px] text-gray-400 max-w-[280px] w-full">
                    <span className="truncate">smartoffice.app</span>
                  </div>
                </div>
                <div className="w-12" />
              </div>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full"
                poster=""
              >
                <source src="/demo.webm" type="video/webm" />
              </video>
            </div>
          </div>
      </div>

      {/* Scroll indicator */}
      <div className="relative z-10 mt-12 w-full flex justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400 animate-bounce-slow">
          <span className="text-xs">Scroll</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-50">
            <path d="M10 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
