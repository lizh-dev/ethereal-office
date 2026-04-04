import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 - SmartOffice',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
      <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">
        <p className="text-gray-500">最終更新日: 2026年4月4日</p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第1条（適用）</h2>
          <p className="text-gray-600">本規約は、株式会社スマートビット（以下「当社」）が提供するSmartOffice（以下「本サービス」）の利用に関する条件を定めるものです。利用者は本規約に同意のうえ、本サービスをご利用ください。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第2条（サービスの内容）</h2>
          <p className="text-gray-600">本サービスは、ブラウザ上で利用できるバーチャルオフィスサービスです。利用者はアカウント登録不要でフロアを作成し、URLを共有してチームメンバーとコミュニケーションを行うことができます。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第3条（禁止事項）</h2>
          <p className="text-gray-600">利用者は以下の行為を行ってはなりません。</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
            <li>法令または公序良俗に反する行為</li>
            <li>当社または第三者の権利を侵害する行為</li>
            <li>サービスの運営を妨げる行為</li>
            <li>不正アクセスまたはそれを試みる行為</li>
            <li>他の利用者に対する嫌がらせや迷惑行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第4条（免責事項）</h2>
          <p className="text-gray-600">当社は本サービスの完全性、正確性、確実性、有用性等について保証いたしません。本サービスの利用により生じた損害について、当社は一切の責任を負いません。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第5条（サービスの変更・終了）</h2>
          <p className="text-gray-600">当社は、事前の通知なく本サービスの内容を変更し、または提供を終了することがあります。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第6条（規約の変更）</h2>
          <p className="text-gray-600">当社は、必要と判断した場合、利用者に通知することなく本規約を変更できるものとします。変更後の規約は、本ページに掲載された時点で効力を生じます。</p>
        </section>

        <div className="pt-8 border-t border-gray-200 mt-8">
          <a href="/" className="text-sky-500 hover:text-sky-400 text-sm font-medium transition-colors">
            ← トップページに戻る
          </a>
        </div>
      </div>
    </main>
  );
}
