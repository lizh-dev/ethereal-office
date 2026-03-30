'use client';

import { useState, useRef, useEffect } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { getAvatarUrl } from '@/components/floor/assets';
import { useWsSend } from '@/contexts/WebSocketContext';

type ChatTab = 'public' | 'dm';

export default function ChatView() {
  const { chatMessages, currentUser, users, dmMessages, dmUnreadCount, setActiveDM, activeDMUserId } = useOfficeStore();
  const wsSend = useWsSend();
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<ChatTab>('public');
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

  // Collect DM conversations with last message and unread count
  const dmConversations = Object.entries(dmMessages).map(([userId, msgs]) => {
    const lastMsg = msgs[msgs.length - 1];
    const user = allUsers.find(u => u.id === userId);
    const unread = dmUnreadCount[userId] || 0;
    return { userId, user, lastMsg, unread, msgs };
  }).filter(c => c.msgs.length > 0).sort((a, b) => {
    const ta = new Date(a.lastMsg?.timestamp || 0).getTime();
    const tb = new Date(b.lastMsg?.timestamp || 0).getTime();
    return tb - ta;
  });

  const totalDMUnread = Object.values(dmUnreadCount).reduce((s, n) => s + n, 0);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Header with tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-12 flex items-center px-4">
          <h2 className="text-sm font-semibold text-gray-700">💬 チャット</h2>
          <span className="ml-2 text-xs text-gray-400">{allUsers.filter(u => u.status !== 'offline').length}人がオンライン</span>
        </div>
        <div className="flex px-4 gap-1">
          <button
            onClick={() => setTab('public')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              tab === 'public'
                ? 'bg-gray-50 text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            全体チャット
          </button>
          <button
            onClick={() => setTab('dm')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors relative ${
              tab === 'dm'
                ? 'bg-gray-50 text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            DM
            {totalDMUnread > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full">
                {totalDMUnread > 9 ? '9+' : totalDMUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'public' ? (
        <>
          {/* Public chat messages */}
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
        </>
      ) : (
        /* DM conversation list */
        <div className="flex-1 overflow-y-auto">
          {dmConversations.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10 px-4">
              ダイレクトメッセージはまだありません。<br />
              メンバータブから💬ボタンでDMを始められます。
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dmConversations.map(({ userId, user, lastMsg, unread }) => {
                const displayName = user?.name || 'ゲスト';
                const displaySeed = user?.avatarSeed || 'default';
                const displayStyle = user?.avatarStyle || 'notionists';
                const time = lastMsg ? new Date(lastMsg.timestamp) : null;
                const timeStr = time ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : '';
                const isFromMe = lastMsg?.from === currentUser.id;

                return (
                  <button
                    key={userId}
                    onClick={() => setActiveDM(userId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <img
                      src={getAvatarUrl(displaySeed, displayStyle)}
                      alt=""
                      className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 truncate">{displayName}</span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeStr}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {isFromMe && <span className="text-gray-400">あなた: </span>}
                        {lastMsg?.text || ''}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
