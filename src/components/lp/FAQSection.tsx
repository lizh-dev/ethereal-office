'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const faqs = [
  {
    q: 'アカウント登録は必要ですか？',
    a: 'いいえ、一切不要です。フロアを作成してURLを共有するだけで、誰でもすぐに参加できます。メールアドレスやパスワードの登録は必要ありません。',
  },
  {
    q: '無料で使えますか？',
    a: 'はい、すべての機能を無料でお使いいただけます。人数制限や機能制限はありません。',
  },
  {
    q: 'oViceやGatherとの違いは？',
    a: 'Ethereal Officeはログイン不要・URL共有だけで始められるシンプルさが最大の特徴です。導入のハードルを極限まで下げ、30秒でバーチャルオフィスを開設できます。',
  },
  {
    q: 'どんなチームに向いていますか？',
    a: 'リモートワーク・ハイブリッドワークのチームに最適です。5人の小規模チームから50人以上の組織まで、テンプレートを選ぶだけでオフィスを構築できます。',
  },
  {
    q: 'スマートフォンから使えますか？',
    a: 'PC/Macのブラウザでの利用を推奨しています。スマートフォンからはLP閲覧とフロア作成が可能です。',
  },
  {
    q: 'セキュリティは大丈夫ですか？',
    a: 'フロアにパスワードを設定でき、URLを知っていてもパスワードなしでは入室できません。また、管理者パスワードで不正なユーザーを退出させることもできます。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: 'フロアのレイアウトデータはサーバーに保存されます。チャット履歴やユーザーのプレゼンス情報はリアルタイムで処理され、安全に管理されています。',
  },
  {
    q: '音声・ビデオ通話はできますか？',
    a: '現在開発中です。近日中にゾーン内での自動音声接続と、距離に応じた音量変化（近接ボイス）機能をリリース予定です。',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-gray-800 group-hover:text-sky-600 transition-colors duration-300 pr-4">
          {q}
        </span>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}
      >
        <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
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
            Ethereal Officeについて、よくいただく質問をまとめました。
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
