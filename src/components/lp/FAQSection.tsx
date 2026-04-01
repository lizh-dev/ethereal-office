'use client';

import { useState, useRef, useEffect } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const faqs = [
  {
    q: 'アカウント登録は必要ですか？',
    a: 'いいえ、一切不要です。フロアを作成してURLを共有するだけで、誰でもすぐに参加できます。メールアドレスやパスワードの登録は必要ありません。',
  },
  {
    q: '無料で使えますか？',
    a: 'はい、基本的な機能はすべて無料でお使いいただけます。まずはお気軽にお試しください。',
  },
  {
    q: '他のバーチャルオフィスサービスとの違いは？',
    a: 'アカウント登録が不要で、URLを共有するだけですぐに始められる手軽さが最大の特長です。わずか30秒でバーチャルオフィスを開設でき、面倒な初期設定は一切ございません。',
  },
  {
    q: 'どんなチームに向いていますか？',
    a: 'リモートワークやハイブリッドワークをされているチームに最適です。5名ほどの少人数チームから50名以上の組織まで、幅広くご活用いただけます。',
  },
  {
    q: 'スマートフォンから使えますか？',
    a: 'パソコンのブラウザでのご利用をおすすめしております。スマートフォンからもフロアの作成や閲覧は可能です。',
  },
  {
    q: 'セキュリティは大丈夫ですか？',
    a: 'フロアにパスワードを設定できるため、URLだけでは入室できないようにすることが可能です。また、管理者パスワードを使って不審なユーザーを退室させることもできます。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: 'フロアのレイアウトデータはサーバーに安全に保存されます。チャットの履歴やメンバーの在席情報もサーバー上で適切に管理されております。',
  },
  {
    q: '音声・ビデオ通話はできますか？',
    a: '距離に応じた音量変化（近接ボイス）や同じエリア内での自動音声接続は、現在実装を進めております。近日中にご提供予定です。',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [a]);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-gray-800 group-hover:text-sky-600 transition-colors duration-300 pr-4">
          {q}
        </span>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 transition-all duration-400 ease-out ${open ? 'rotate-45 bg-sky-100' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        style={{ maxHeight: open ? height + 20 : 0 }}
        className="overflow-hidden transition-all duration-400 ease-out"
      >
        <p className={`text-sm text-gray-500 leading-relaxed pb-5 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>{a}</p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="scroll-reveal relative py-16 sm:py-24 px-4 bg-gray-50/50">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sky-500 font-semibold text-sm tracking-wider uppercase mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            よくある質問
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            SmartOfficeについて、よくいただく質問をまとめました。
          </p>
        </div>

        {/* FAQ list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
