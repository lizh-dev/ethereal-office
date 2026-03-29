'use client';

import { useState, useEffect, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const QRScannerModal = dynamic(() => import('@/components/QRScannerModal'), { ssr: false });

interface VisitEntry {
  slug: string;
  name: string;
  visitedAt: string;
}

const CreateFloorSection = forwardRef<HTMLElement>(function CreateFloorSection(_, forwardedRef) {
  const router = useRouter();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [floorName, setFloorName] = useState('');
  const [visitHistory, setVisitHistory] = useState<VisitEntry[]>([]);
  const [creatorName, setCreatorName] = useState('');
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('ethereal-visit-history') || '[]');
      setVisitHistory(history);
    } catch { /* ignore */ }
  }, []);

  const template = 'empty'; // Always empty — user builds via SpaceWizard after joining

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
          excalidrawScene: {
            elements: [],
            appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to create floor');

      const floor = await res.json();
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

  const setRefs = (node: HTMLElement | null) => {
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  return (
    <section
      id="create"
      ref={setRefs}
      className="scroll-reveal relative py-16 sm:py-24 px-4"
    >
      <div className="max-w-xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            今すぐ
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">始めよう</span>
          </h2>
          <p className="text-gray-500">
            30秒でバーチャルオフィスを作成できます
          </p>
        </div>

        {/* QR Scanner button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sm font-medium text-sky-600 hover:bg-sky-100 transition-all duration-300"
          >
            📁 QRコード画像で入室
          </button>
        </div>

        {/* Creation form */}
        <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-sky-50/50">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">新しいフロアを作成</h3>

          <div className="space-y-5">
            {/* Floor name */}
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Creator name */}
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Password */}
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Owner password */}
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-300"
              />
              <p className="text-[10px] text-gray-400 mt-1">どのPCからでもこのパスワードで管理者になれます</p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Submit button */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-300 disabled:text-white/70 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(14,165,233,0.25)] hover:scale-[1.02]"
            >
              {creating ? '作成中...' : 'フロアを作成'}
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-4">
            作成後、URLを共有するだけで誰でも参加できます
          </p>
        </div>

        {/* Visit history */}
        {visitHistory.length > 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">最近のフロア</h3>
            <div className="space-y-2">
              {visitHistory.slice(0, 5).map((entry) => {
                const date = new Date(entry.visitedAt);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                return (
                  <button
                    key={entry.slug}
                    onClick={() => router.push(`/f/${entry.slug}`)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-sky-50 rounded-xl transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="text-sm font-medium text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{entry.name}</div>
                        <div className="text-[10px] text-gray-400">{timeStr}</div>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-sky-500 text-sm transition-colors duration-300">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
    </section>
  );
});

export default CreateFloorSection;
