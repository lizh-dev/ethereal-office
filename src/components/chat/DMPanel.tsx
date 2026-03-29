'use client';

import { useState, useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';

const STATUS_COLORS: Record<string, string> = {
  online: '#4CAF50', busy: '#F44336', focusing: '#FF9800', offline: '#BDBDBD',
};

export default function DMPanel() {
  const { activeDMUserId, dmMessages, currentUser, users, setActiveDM, clearDMUnread } = useOfficeStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const targetUser = users.find(u => u.id === activeDMUserId);
  const messages = activeDMUserId ? (dmMessages[activeDMUserId] || []) : [];

  // Clear unread when panel opens
  useEffect(() => {
    if (activeDMUserId) {
      clearDMUnread(activeDMUserId);
    }
  }, [activeDMUserId, clearDMUnread]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!activeDMUserId || !targetUser) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    const wsSend = (window as unknown as Record<string, any>).__wsSend;
    wsSend?.dm?.(activeDMUserId, text);
    setInput('');
  };

  const allUsers = [currentUser, ...users];

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 360,
        height: 480,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={getAvatarUrl(targetUser.avatarSeed || 'default', targetUser.avatarStyle || 'notionists')}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `2px solid ${STATUS_COLORS[targetUser.status] || '#BDBDBD'}`,
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: STATUS_COLORS[targetUser.status] || '#BDBDBD',
            border: '2px solid #f9fafb',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {targetUser.name}
          </div>
          {targetUser.statusMessage && (
            <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {targetUser.statusMessage}
            </div>
          )}
        </div>
        <button
          onClick={() => setActiveDM(null)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          title="閉じる"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 60 }}>
            {targetUser.name} とのダイレクトメッセージ<br />
            メッセージを送りましょう
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.from === currentUser.id;
            const sender = allUsers.find(u => u.id === msg.from);
            const displayName = sender?.name || 'ゲスト';
            const displaySeed = sender?.avatarSeed || 'default';
            const displayStyle = sender?.avatarStyle || 'notionists';
            const time = new Date(msg.timestamp);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <img
                  src={getAvatarUrl(displaySeed, displayStyle)}
                  alt=""
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    flexShrink: 0,
                  }}
                />
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 2,
                    flexDirection: isMe ? 'row-reverse' : 'row',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>{displayName}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeStr}</span>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 14,
                    fontSize: 13,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    ...(isMe
                      ? { background: '#4F46E5', color: '#fff', borderTopRightRadius: 4 }
                      : { background: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb', borderTopLeftRadius: 4 }
                    ),
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        gap: 8,
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="メッセージを入力..."
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            fontSize: 13,
            outline: 'none',
            background: '#f9fafb',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = '#fff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: input.trim() ? '#4F46E5' : '#e5e7eb',
            color: input.trim() ? '#fff' : '#9ca3af',
            fontSize: 13,
            fontWeight: 500,
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}
