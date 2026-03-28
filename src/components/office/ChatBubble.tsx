'use client';

import { useEffect, useState } from 'react';

interface ChatBubbleProps {
  text: string;
}

export default function ChatBubble({ text }: ChatBubbleProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), 4000);
    const hideTimer = setTimeout(() => setVisible(false), 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [text]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 32,
        animation: 'bubbleIn 0.25s ease-out',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '6px 12px',
          fontSize: 12,
          color: '#1f2937',
          maxWidth: 200,
          wordBreak: 'break-word',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          lineHeight: '18px',
        }}
      >
        {text}
        {/* Speech bubble arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10,
            height: 10,
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderLeft: 'none',
          }}
        />
      </div>
    </div>
  );
}
