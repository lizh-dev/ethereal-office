'use client';

import { useState, useEffect, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getTemplateElements } from '@/lib/templates';
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

  // Use a callback ref to merge forwardedRef and sectionRef
  const setRefs = (node: HTMLElement | null) => {
    // Set the scroll reveal ref
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
    // Set the forwarded ref
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
      className="scroll-reveal relative py-24 sm:py-32 px-4"
    >
      <div className="max-w-xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-indigo-400 font-semibold text-sm tracking-wider uppercase mb-3">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            今すぐ
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">始めよう</span>
          </h2>
          <p className="text-gray-500">
            30秒でバーチャルオフィスを作成できます
          </p>
        </div>

        {/* QR Scanner button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            📁 QRコード画像で入室
          </button>
        </div>

        {/* Creation form */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl">
          {/* Glow border effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/20 via-transparent to-purple-500/20 -z-10" />

          <h3 className="text-xl font-semibold text-white mb-6">新しいフロアを作成</h3>

          <div className="space-y-5">
            {/* Template selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">テンプレート</label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                      template === t.id
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-white">{t.name}</div>
                        <div className="text-[10px] text-gray-500">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Floor name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                フロア名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="例: 開発チームのオフィス"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Creator name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                あなたの名前（任意）
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="例: 田中太郎"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                パスワード（任意）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="設定するとURL知っていてもパスワードが必要"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Owner password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                管理者パスワード（任意）
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="フロア編集・メンバー退出に必要"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300"
              />
              <p className="text-[10px] text-gray-600 mt-1">どのPCからでもこのパスワードで管理者になれます</p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Submit button */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-white/50 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-[1.02]"
            >
              {creating ? '作成中...' : 'フロアを作成'}
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-4">
            作成後、URLを共有するだけで誰でも参加できます
          </p>
        </div>

        {/* Visit history */}
        {visitHistory.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">最近のフロア</h3>
            <div className="space-y-2">
              {visitHistory.slice(0, 5).map((entry) => {
                const date = new Date(entry.visitedAt);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                return (
                  <button
                    key={entry.slug}
                    onClick={() => router.push(`/f/${entry.slug}`)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-indigo-500/10 rounded-xl transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="text-sm font-medium text-gray-300 group-hover:text-indigo-400 transition-colors duration-300">{entry.name}</div>
                        <div className="text-[10px] text-gray-600">{timeStr}</div>
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-indigo-400 text-sm transition-colors duration-300">→</span>
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
