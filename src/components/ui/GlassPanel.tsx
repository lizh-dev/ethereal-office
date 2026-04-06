'use client';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <div
      className={`
        backdrop-blur-xl
        bg-white/70 border border-zinc-200/80
        dark:bg-zinc-900/70 dark:border-zinc-700/50
        rounded-2xl shadow-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
}
