'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
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
  const [ownerEmail, setOwnerEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [isPro, setIsPro] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('ethereal-visit-history') || '[]');
      setVisitHistory(history);
    } catch { /* ignore */ }
    // Restore previously verified email
    const savedEmail = localStorage.getItem('ethereal-owner-email');
    if (savedEmail) {
      setOwnerEmail(savedEmail);
      setEmailVerified(true);
      // Check Pro status
      fetch(`/api/floors/by-owner?email=${encodeURIComponent(savedEmail)}`)
        .then(r => r.json())
        .then(floors => {
          if (Array.isArray(floors) && floors.length > 0) {
            fetch(`/api/floors/${floors[0].slug}/permissions`)
              .then(r => r.json())
              .then(p => { if (p.plan === 'pro') setIsPro(true); })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  const template = 'empty'; // Always empty — user builds via SpaceWizard after joining

  const handleSendCode = async () => {
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      const res = await fetch('/api/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail.trim() }),
      });
      if (!res.ok) throw new Error();
      setCodeSent(true);
    } catch {
      setError('認証コードの送信に失敗しました');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6) {
      setError('6桁の認証コードを入力してください');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail.trim(), code: verifyCode }),
      });
      const data = await res.json();
      if (data.verified) {
        setEmailVerified(true);
        localStorage.setItem('ethereal-owner-email', ownerEmail.trim());
        // Check if this email has Pro
        fetch(`/api/floors/by-owner?email=${encodeURIComponent(ownerEmail.trim())}`)
          .then(r => r.json())
          .then(floors => {
            // If user has floors, check first floor's plan
            if (Array.isArray(floors) && floors.length > 0) {
              fetch(`/api/floors/${floors[0].slug}/permissions`)
                .then(r => r.json())
                .then(p => { if (p.plan === 'pro') setIsPro(true); })
                .catch(() => {});
            }
          })
          .catch(() => {});
      } else {
        setError('認証コードが正しくありません');
      }
    } catch {
      setError('認証に失敗しました');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreate = async () => {
    if (!floorName.trim()) {
      setError('フロア名を入力してください');
      return;
    }
    if (!emailVerified) {
      setError('メールアドレスの認証を完了してください');
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
          ownerEmail: ownerEmail.trim(),
          customSlug: (isPro && customSlug.trim()) ? customSlug.trim() : undefined,
          creatorName: creatorName.trim() || undefined,
          password: password.trim() || undefined,
          ownerPassword: ownerPassword.trim() || undefined,
          excalidrawScene: {
            elements: [],
            appState: { viewBackgroundColor: '#f5f5f5', gridSize: 20 },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'floor_limit' || data.error === 'slug_taken' || data.error === 'invalid_slug' || data.error === 'pro_required') {
          setError(data.message);
          setCreating(false);
          return;
        }
        throw new Error('Failed to create floor');
      }

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

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setCustomSlug(cleaned);
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    if (!cleaned || cleaned.length < 3) {
      setSlugStatus(cleaned ? 'invalid' : 'idle');
      return;
    }
    setSlugStatus('checking');
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/floors/check-slug?slug=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : data.reason ? 'invalid' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
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
      className="scroll-reveal relative py-16 sm:py-24 px-4 bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="max-w-xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            今すぐ、チームの
            <span className="text-accent">オフィス</span>
            を作ろう
          </h2>
          <p className="text-zinc-500">
            わずか30秒でバーチャルオフィスを作成できます
          </p>
        </div>

        {/* QR Scanner button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-300"
          >
            📁 QRコード画像で入室
          </button>
        </div>

        {/* Creation form — BezelCard dark pattern */}
        <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
          <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-8">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">新しいフロアを作成</h3>

            <div className="space-y-5">
              {/* Owner email with verification */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => { setOwnerEmail(e.target.value); setEmailVerified(false); setCodeSent(false); }}
                    placeholder="you@example.com"
                    disabled={emailVerified}
                    className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 disabled:opacity-60"
                  />
                  {!emailVerified && !codeSent && (
                    <button
                      onClick={handleSendCode}
                      disabled={sendingCode || !ownerEmail.includes('@')}
                      className="px-4 py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-zinc-950 text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                    >
                      {sendingCode ? '送信中...' : '認証'}
                    </button>
                  )}
                  {emailVerified && (
                    <span className="flex items-center px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-xl border border-emerald-200 dark:border-emerald-700/30">
                      認証済み
                    </span>
                  )}
                </div>
                {codeSent && !emailVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                      placeholder="6桁の認証コード"
                      maxLength={6}
                      className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 tracking-widest text-center text-lg"
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={verifying || verifyCode.length !== 6}
                      className="px-4 py-3 bg-accent hover:bg-accent-hover disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-zinc-950 text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                    >
                      {verifying ? '確認中...' : '確認'}
                    </button>
                  </div>
                )}
                {codeSent && !emailVerified && (
                  <p className="text-[11px] text-zinc-500 mt-1">メールに届いた6桁のコードを入力してください。
                    <button onClick={handleSendCode} className="text-accent hover:underline ml-1">再送信</button>
                  </p>
                )}
                <p className="text-[10px] text-zinc-500 mt-1">フロア管理・Proプラン購入に使用します</p>
              </div>

              {/* Floor name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  フロア名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="例: 開発チームのオフィス"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                />
              </div>

              {/* Custom slug — Pro only */}
              {isPro && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    カスタムID（Pro限定）
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 flex-shrink-0">/f/</span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="my-team（空欄ならランダム）"
                      maxLength={30}
                      className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300 font-mono"
                    />
                    {slugStatus === 'checking' && <span className="text-xs text-zinc-500">確認中...</span>}
                    {slugStatus === 'available' && <span className="text-xs text-emerald-400 font-medium">使用可能</span>}
                    {slugStatus === 'taken' && <span className="text-xs text-red-400 font-medium">使用中</span>}
                    {slugStatus === 'invalid' && <span className="text-xs text-amber-400 font-medium">3文字以上</span>}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">英数字・ハイフン・アンダースコア（3〜30文字）</p>
                </div>
              )}

              {/* Creator name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  あなたの名前（任意）
                </label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="例: 田中太郎"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  パスワード（任意）
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="設定すると、入室時にパスワードの入力が必要になります"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                />
              </div>

              {/* Owner password */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  管理者パスワード（任意）
                </label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="フロアの編集やメンバーの退室操作に必要です"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                />
                <p className="text-[10px] text-zinc-500 mt-1">どの端末からでもこのパスワードで管理者としてログインできます</p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {/* Submit button */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-3.5 bg-accent hover:bg-accent-hover disabled:bg-amber-600/50 disabled:text-zinc-950/50 text-zinc-950 font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02]"
              >
                {creating ? '作成中...' : 'フロアを作成'}
              </button>
            </div>

            <p className="text-center text-zinc-500 text-sm mt-4">
              作成後、URLを共有するだけでどなたでも参加いただけます
            </p>
          </div>
        </div>

        {/* Visit history */}
        {visitHistory.length > 0 && (
          <div className="mt-8 rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
            <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6">
              <h3 className="text-sm font-semibold text-zinc-500 mb-3">最近のフロア</h3>
              <div className="space-y-2">
                {visitHistory.slice(0, 5).map((entry) => {
                  const date = new Date(entry.visitedAt);
                  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                  return (
                    <button
                      key={entry.slug}
                      onClick={() => router.push(`/f/${entry.slug}`)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 rounded-xl transition-all duration-300 text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏢</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-accent transition-colors duration-300">{entry.name}</div>
                          <div className="text-[10px] text-zinc-500">{timeStr}</div>
                        </div>
                      </div>
                      <span className="text-zinc-600 group-hover:text-accent text-sm transition-colors duration-300">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
    </section>
  );
});

export default CreateFloorSection;
