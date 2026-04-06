'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Video, MessageCircle, Timer, PenTool, LayoutDashboard, Zap, Mic, MonitorUp, Users, Clock, Send } from 'lucide-react';

export default function FeaturesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="features" ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            チームが自然とつながる<span className="text-accent">機能</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            すべて無料。アカウント登録なしで、すぐにお使いいただけます。
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4">

          {/* ===== Row 1: Video (7) + Chat (5) ===== */}
          <div className="col-span-12 md:col-span-7">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Video className="w-4 h-4 text-sky-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">ビデオ会議・画面共有</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  ワンクリックでミーティングを開始。1:1通話もメンバーリストからすぐに発信できます。
                </p>
                {/* Meeting UI mockup */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 aspect-video rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-sky-500">YT</span>
                      </div>
                    </div>
                    <div className="flex-1 aspect-video rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-emerald-500">KS</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><Mic className="w-3 h-3 text-text-tertiary" /></div>
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><Video className="w-3 h-3 text-text-tertiary" /></div>
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><MonitorUp className="w-3 h-3 text-text-tertiary" /></div>
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center"><span className="w-3 h-1.5 rounded-sm bg-red-500" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat (5) */}
          <div className="col-span-12 md:col-span-5">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">チャット・DM</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  フロア全体のチャットと、個別のダイレクトメッセージ。
                </p>
                {/* Chat UI mockup */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 shrink-0" />
                      <div className="bg-white dark:bg-zinc-700 rounded-lg rounded-bl-none px-3 py-1.5 text-[10px] text-text-secondary">この機能のレビューお願い</div>
                    </div>
                    <div className="flex gap-2 items-end justify-end">
                      <div className="bg-accent/10 rounded-lg rounded-br-none px-3 py-1.5 text-[10px] text-amber-700 dark:text-amber-400">了解！見ておきます</div>
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 shrink-0" />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 shrink-0" />
                      <div className="bg-white dark:bg-zinc-700 rounded-lg rounded-bl-none px-3 py-1.5 text-[10px] text-text-secondary">私も参加します！</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-7 rounded-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 px-3 flex items-center">
                      <span className="text-[9px] text-text-tertiary">メッセージ...</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                      <Send className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Row 2: Timer (5) + Whiteboard (7) ===== */}
          <div className="col-span-12 md:col-span-5">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-amber-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">集中タイマー</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  声をかけてよいタイミングがチームに伝わります。
                </p>
                {/* Timer UI mockup */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-text-primary mb-1 font-mono">18:42</div>
                  <div className="text-[10px] text-amber-500 font-medium mb-3">取込中</div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-[10px] font-medium text-amber-600 dark:text-amber-400">15分</div>
                    <div className="px-3 py-1 rounded-full bg-accent text-[10px] font-medium text-zinc-950">25分</div>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-[10px] font-medium text-amber-600 dark:text-amber-400">50分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Whiteboard (7) */}
          <div className="col-span-12 md:col-span-7">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <PenTool className="w-4 h-4 text-violet-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">共有ホワイトボード</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  ミーティング中にリアルタイムで共同編集。図形・テキスト・フリーハンドで自由に書き込めます。
                </p>
                {/* Board mockup */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className="relative w-full h-28 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="absolute top-3 left-4 w-20 h-6 rounded bg-violet-500/10 border border-violet-500/20" />
                    <div className="absolute top-12 left-8 w-32 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
                    <div className="absolute top-4 right-8 w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20" />
                    <div className="absolute bottom-3 left-4 w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20" />
                    <svg className="absolute bottom-4 right-4" width="60" height="30" viewBox="0 0 60 30" fill="none">
                      <path d="M2 28C10 20 20 5 30 15C40 25 50 10 58 2" stroke="rgba(139,92,246,0.3)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {/* Cursors */}
                    <div className="absolute top-6 left-28 flex items-center gap-1">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(59,130,246,0.7)"><path d="M0 0L10 8L4 8L2 12L0 0Z" /></svg>
                      <span className="text-[8px] bg-blue-500/80 text-white px-1 rounded">田中</span>
                    </div>
                    <div className="absolute bottom-8 right-16 flex items-center gap-1">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(245,158,11,0.7)"><path d="M0 0L10 8L4 8L2 12L0 0Z" /></svg>
                      <span className="text-[8px] bg-amber-500/80 text-white px-1 rounded">佐藤</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Row 3: Custom Office (8) + Login-free (4) ===== */}
          <div className="col-span-12 md:col-span-8">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">カスタムオフィス</h3>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  デスク・会議室・ラウンジ・カフェを自由に配置。ガイドに沿って進めるだけで30秒で完成。
                </p>
                {/* Office layout mockup */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className="flex gap-2">
                    <div className="flex-[3] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2">
                      <div className="text-[8px] text-text-tertiary mb-1.5 font-medium">ワークスペース</div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="aspect-square rounded bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-500/20" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-[1] flex flex-col gap-2">
                      <div className="flex-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2">
                        <div className="text-[8px] text-text-tertiary mb-1 font-medium">会議室</div>
                        <div className="w-full aspect-square rounded bg-sky-500/5 border border-sky-500/10 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-sky-500/10 border border-sky-500/20" />
                        </div>
                      </div>
                      <div className="flex-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2">
                        <div className="text-[8px] text-text-tertiary mb-1 font-medium">ラウンジ</div>
                        <div className="flex gap-0.5 mt-1">
                          <div className="w-4 h-2 rounded-sm bg-emerald-500/10" />
                          <div className="w-4 h-2 rounded-sm bg-emerald-500/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login-free (4) */}
          <div className="col-span-12 md:col-span-4">
            <div className="rounded-2xl p-[1px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-300 h-full">
              <div className="rounded-[14px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/30 p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4 text-rose-500" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2">ログイン不要</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  URL共有だけでチーム全員が参加
                </p>
                {/* URL share mockup */}
                <div className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-700 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-600">
                    <div className="w-3 h-3 rounded bg-emerald-400/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[9px] text-text-tertiary truncate">smartoffice.app/f/...</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Users className="w-3 h-3 text-text-tertiary" />
                    <span className="text-[9px] text-text-tertiary">クリックするだけで参加</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
