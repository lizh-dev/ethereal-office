'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getTemplateElements } from '@/lib/templates';

const QRScannerModal = dynamic(() => import('@/components/QRScannerModal'), { ssr: false });

interface VisitEntry {
  slug: string;
  name: string;
  visitedAt: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [floorName, setFloorName] = useState('');
  const [visitHistory, setVisitHistory] = useState<VisitEntry[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [template, setTemplate] = useState('default');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('ethereal-visit-history') || '[]');
      setVisitHistory(history);
    } catch { /* ignore */ }
  }, []);

  const templates = [
    { id: 'default', name: 'スタンダード', desc: 'デスク+会議室+ラウンジ', icon: '🏢' },
    { id: 'small', name: '小規模チーム', desc: 'デスク8席+会議室1つ', icon: '🏠' },
    { id: 'meeting', name: '会議室中心', desc: '会議室3つ+フリースペース', icon: '🤝' },
    { id: 'empty', name: '空のフロア', desc: '自由にデザイン', icon: '📐' },
  ];

  const handleCreate = async () => {
    if (!floorName.trim()) {
      setError('フロア名を入力してください');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: floorName.trim(),
          creatorName: creatorName.trim() || undefined,
          password: password.trim() || undefined,
          ownerPassword: ownerPassword.trim() || undefined,
          excalidrawScene: template !== 'empty' ? {
            elements: getTemplateElements(template),
            appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
          } : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create floor');

      const floor = await res.json();
      // Store the edit token securely (only returned on creation)
      if (floor.editToken) {
        const tokens = JSON.parse(localStorage.getItem('ethereal-edit-tokens') || '{}');
        tokens[floor.slug] = floor.editToken;
        localStorage.setItem('ethereal-edit-tokens', JSON.stringify(tokens));
      }
      router.push(`/f/${floor.slug}`);
    } catch {
      setError('フロアの作成に失敗しました');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ethereal Office</h1>
          <p className="text-gray-500 text-lg">バーチャルオフィスを作成して、チームとつながろう</p>
          <button
            onClick={() => setShowScanner(true)}
            className="mt-3 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            📁 QRコード画像で入室
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">新しいフロアを作成</h2>

          <div className="space-y-4">
            {/* Template selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">テンプレート</label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      template === t.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{t.name}</div>
                        <div className="text-[10px] text-gray-500">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フロア名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="例: 開発チームのオフィス"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                あなたの名前（任意）
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="例: 田中太郎"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（任意）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="設定するとURL知っていてもパスワードが必要"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                管理者パスワード（任意）
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="フロア編集・メンバー退出に必要"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
              <p className="text-[10px] text-gray-400 mt-1">どのPCからでもこのパスワードで管理者になれます</p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl transition-colors"
            >
              {creating ? '作成中...' : 'フロアを作成'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          作成後、URLを共有するだけで誰でも参加できます
        </p>

        {/* Visit history */}
        {visitHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">最近のフロア</h3>
            <div className="space-y-2">
              {visitHistory.slice(0, 5).map((entry) => {
                const date = new Date(entry.visitedAt);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                return (
                  <button
                    key={entry.slug}
                    onClick={() => router.push(`/f/${entry.slug}`)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{entry.name}</div>
                        <div className="text-[10px] text-gray-400">{timeStr}</div>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-400 text-sm">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
    </div>
  );
}
