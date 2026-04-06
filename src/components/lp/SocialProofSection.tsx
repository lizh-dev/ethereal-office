'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Shield, Zap, Globe, Users, Video, Clock } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: <Zap className="w-4 h-4" />, text: '30秒でオフィス作成' },
  { icon: <Users className="w-4 h-4" />, text: 'アカウント登録不要' },
  { icon: <Video className="w-4 h-4" />, text: 'ビデオ会議・画面共有' },
  { icon: <Globe className="w-4 h-4" />, text: 'ブラウザだけで完結' },
  { icon: <Shield className="w-4 h-4" />, text: 'SSL暗号化通信' },
  { icon: <Clock className="w-4 h-4" />, text: '集中タイマー搭載' },
];

function MarqueeRow() {
  return (
    <div className="flex items-center gap-10 px-5 whitespace-nowrap">
      {HIGHLIGHTS.map((item) => (
        <span
          key={item.text}
          className="flex items-center gap-2 text-text-tertiary text-sm font-medium"
        >
          <span className="text-accent opacity-70">{item.icon}</span>
          {item.text}
        </span>
      ))}
    </div>
  );
}

export default function SocialProofSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="scroll-reveal py-6 bg-surface border-y border-border overflow-hidden"
    >
      <div className="flex animate-marquee">
        <MarqueeRow />
        <MarqueeRow />
      </div>
    </section>
  );
}
