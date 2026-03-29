'use client';

import { useState, useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';

export default function ChatView() {
  const { chatMessages, currentUser, users, sendMessage } = useOfficeStore();
  const wsSend = useWsSend();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const allUsers = [currentUser, ...users];

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    wsSend.chat(text);
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <h2 className="text-sm font-semibold text-gray-700">💬 チャット</h2>
        <span className="ml-2 text-xs text-gray-400">{allUsers.filter(u => u.status !== 'offline').length}人がオンライン</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            メッセージはまだありません。<br />チャットを始めましょう！
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const user = allUsers.find(u => u.id === msg.userId);
            const isMe = msg.userId === currentUser.id;
            const displayName = user?.name || (isMe ? currentUser.name : 'ゲスト');
            const displaySeed = user?.avatarSeed || (isMe ? currentUser.avatarSeed : undefined) || 'default';
            const displayStyle = user?.avatarStyle || (isMe ? currentUser.avatarStyle : undefined) || 'notionists';
            const time = new Date(msg.timestamp);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

            return (
              <div key={`${msg.timestamp}-${i}`} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img
                  src={getAvatarUrl(displaySeed, displayStyle)}
                  alt=""
                  className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                />
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium text-gray-600">{displayName}</span>
                    <span className="text-[10px] text-gray-400">{timeStr}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-indigo-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}>
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
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-indigo-300 focus:bg-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-full text-sm font-medium transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
