'use client';

import { useEffect, useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface HeroSectionProps {
  onCtaClick: () => void;
}

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

    // Nodes representing people across the full canvas
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      radius: 4 + Math.random() * 5,
      hue: [195, 200, 210, 220, 230, 180, 240, 185][i % 8],
      online: i < 14,
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

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * w / 100;
          const dy = (a.y - b.y) * h / 100;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = w * 0.22;
          if (dist < maxDist && a.online && b.online) {
            const alpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x * w / 100, a.y * h / 100);
            ctx.lineTo(b.x * w / 100, b.y * h / 100);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const nx = node.x * w / 100;
        const ny = node.y * h / 100;
        const pulseScale = node.online ? 1 + Math.sin(node.pulse) * 0.12 : 1;

        if (node.online) {
          const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.radius * 3.5 * pulseScale);
          glow.addColorStop(0, `hsla(${node.hue}, 80%, 65%, 0.12)`);
          glow.addColorStop(1, `hsla(${node.hue}, 80%, 65%, 0)`);
          ctx.beginPath();
          ctx.arc(nx, ny, node.radius * 3.5 * pulseScale, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(nx, ny, node.radius * pulseScale, 0, Math.PI * 2);
        if (node.online) {
          const grad = ctx.createRadialGradient(nx - 2, ny - 2, 0, nx, ny, node.radius);
          grad.addColorStop(0, `hsla(${node.hue}, 85%, 72%, 0.85)`);
          grad.addColorStop(1, `hsla(${node.hue}, 75%, 58%, 0.85)`);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = 'rgba(200, 215, 225, 0.25)';
        }
        ctx.fill();

        if (node.online) {
          ctx.beginPath();
          ctx.arc(nx + node.radius * 0.6, ny - node.radius * 0.6, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#4ade80';
          ctx.fill();
        }
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

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="scroll-reveal relative min-h-screen flex items-center justify-center overflow-hidden px-4"
    >
      {/* Full-screen network animation as background */}
      <NetworkCanvas />

      {/* Soft gradient blobs behind */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-200/30 blur-[120px] animate-blob-1" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-[120px] animate-blob-2" />
      </div>

      {/* Content on top */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
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

        {/* Stats / social proof */}
        <div className="mt-16 flex items-center justify-center gap-8 sm:gap-12">
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
