'use client';

interface BezelCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'p-5',
  md: 'p-7',
  lg: 'p-9',
};

export default function BezelCard({ children, className = '', innerClassName = '', size = 'md' }: BezelCardProps) {
  return (
    <div
      className={`
        rounded-2xl p-[1px]
        bg-zinc-100 border border-zinc-200
        dark:bg-zinc-800/50 dark:border-zinc-700/50
        ${className}
      `}
    >
      <div
        className={`
          rounded-[14px]
          bg-white border border-zinc-200/50
          dark:bg-zinc-900 dark:border-zinc-700/30
          ${sizeMap[size]}
          ${innerClassName}
        `}
      >
        {children}
      </div>
    </div>
  );
}
