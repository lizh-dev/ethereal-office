'use client';

import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface BaseProps {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type AccentButtonProps = ButtonProps | LinkProps;

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-zinc-950 hover:bg-accent-hover font-semibold',
  secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium',
  ghost: 'text-text-secondary hover:text-text-primary font-medium',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function AccentButton(props: AccentButtonProps) {
  const { variant = 'primary', size = 'md', pill = false, className = '', ...rest } = props;

  const classes = `
    inline-flex items-center justify-center gap-2
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${pill ? 'rounded-full' : 'rounded-xl'}
    transition-[transform,background-color] duration-200
    hover:scale-[1.02] active:scale-[0.98]
    disabled:opacity-50 disabled:pointer-events-none
    ${className}
  `.trim();

  if ('href' in rest && rest.href) {
    const { href, ...anchorRest } = rest as LinkProps;
    return <a href={href} className={classes} {...anchorRest} />;
  }

  return <button className={classes} {...(rest as ButtonProps)} />;
}
