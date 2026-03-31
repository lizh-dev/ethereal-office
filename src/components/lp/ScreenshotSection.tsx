'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const screenshots = [
  {
    id: 'office',
    label: 'バーチャルオフィス',
    description: 'アイソメトリックなフロアマップでチームの居場所が一目瞭然。座席をクリックするだけで着席できます。',
    mockup: (
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl border border-gray-200 overflow-hidden relative">
        {/* Mock office UI */}
        <div className="h-8 bg-white border-b border-gray-200 flex items-center px-3 gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <div className="text-[9px] text-gray-400 font-medium">SmartOffice</div>
          <div className="flex-1" />
          <div className="w-16 h-4 bg-gray-100 rounded-full" />
        </div>
        <div className="flex h-full">
          <div className="w-8 bg-white border-r border-gray-100 flex flex-col items-center gap-2 pt-3">
            {['🏢','👥','💬','⚙️'].map(e => <div key={e} className="text-[8px]">{e}</div>)}
          </div>
          <div className="flex-1 p-4 relative">
            {/* Desks */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mt-2">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="aspect-square bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full ${i === 1 ? 'bg-sky-400' : i === 4 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
            {/* Labels */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="px-2 py-0.5 bg-sky-100 rounded text-[7px] text-sky-600 font-medium">A-1</div>
              <div className="px-2 py-0.5 bg-sky-100 rounded text-[7px] text-sky-600 font-medium">A-2</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'voice',
    label: '近接ボイス',
    description: '近くの人の声が自然に聞こえる。距離に応じて音量が変化し、まるで隣にいるような体験。',
    mockup: (
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center">
        {/* Proximity visualization */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-green-200 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-green-300 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-lg">You</div>
            </div>
          </div>
          {/* Other users */}
          <div className="absolute top-2 right-0 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center text-white text-[8px] font-bold shadow">A</div>
          <div className="absolute bottom-4 left-0 w-7 h-7 rounded-full bg-violet-400 flex items-center justify-center text-white text-[8px] font-bold shadow">B</div>
          <div className="absolute -top-2 left-6 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-[7px] font-bold opacity-50">C</div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
          🎙️ 2人の声が聞こえます
        </div>
      </div>
    ),
  },
  {
    id: 'focus',
    label: '集中タイマー',
    description: 'ポモドーロタイマーでステータスが自動変更。「いつ声かけていいか」がチーム全員にわかる。',
    mockup: (
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-gray-200 overflow-hidden relative flex flex-col items-center justify-center gap-3">
        <div className="px-4 py-2 bg-amber-100 rounded-xl border border-amber-200">
          <span className="text-amber-700 text-sm font-bold">🎯 集中中 18:42</span>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] text-gray-500">15分</div>
          <div className="px-3 py-1 bg-amber-500 rounded-lg text-[10px] text-white font-medium">25分</div>
          <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] text-gray-500">50分</div>
        </div>
        <p className="text-[9px] text-amber-600 mt-1">集中中は通話リクエストを自動拒否</p>
      </div>
    ),
  },
];

export default function ScreenshotSection() {
  const ref = useScrollReveal<HTMLElement>();
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-gray-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">Product</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            実際の<span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">画面</span>を見てみよう
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            30秒で作れるバーチャルオフィスの中身をご紹介
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center gap-2 mb-8">
          {screenshots.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                active === i
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                  : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{screenshots[active].label}</h3>
            <p className="text-gray-500 leading-relaxed mb-6">{screenshots[active].description}</p>
            <div className="flex gap-3">
              <a href="#create" className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors">
                無料で試す
              </a>
            </div>
          </div>
          <div className="order-first md:order-last">
            {screenshots[active].mockup}
          </div>
        </div>
      </div>
    </section>
  );
}
