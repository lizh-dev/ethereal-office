'use client';

import { useState, useCallback } from 'react';
import { useOfficeStore } from '@/store/officeStore';

export default function ChatInput() {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const sendMessage = useOfficeStore((s) => s.sendMessage);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = text.trim();
      if (!trimmed) return;
      sendMessage(trimmed);
      setText('');
    },
    [text, sendMessage],
  );

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="メッセージを入力..."
        style={{
          width: 320,
          padding: '10px 16px',
          borderRadius: 24,
          border: isFocused ? '2px solid #818cf8' : '1px solid #d1d5db',
          backgroundColor: 'rgba(255,255,255,0.95)',
          fontSize: 13,
          color: '#1f2937',
          outline: 'none',
          boxShadow: isFocused
            ? '0 4px 16px rgba(79,70,229,0.15)'
            : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: text.trim() ? '#4F46E5' : '#d1d5db',
          color: '#fff',
          cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s, transform 0.15s',
          transform: text.trim() ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}
