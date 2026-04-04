import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー - SmartOffice',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
      <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">
        <p className="text-gray-500">最終更新日: 2026年4月4日</p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. 収集する情報</h2>
          <p className="text-gray-600">本サービスでは、以下の情報を取得する場合があります。</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
            <li>フロア名、表示名などの利用者が入力した情報</li>
            <li>チャットメッセージの内容</li>
            <li>フロアのレイアウトデータ</li>
            <li>Proプランご利用時の請求先メールアドレス</li>
            <li>アクセスログ（IPアドレス、ブラウザ情報等）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. 情報の利用目的</h2>
          <p className="text-gray-600">取得した情報は、以下の目的で利用いたします。</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
            <li>本サービスの提供・運営</li>
            <li>サービスの改善および新機能の開発</li>
            <li>お問い合わせへの対応</li>
            <li>不正利用の防止</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. 情報の第三者提供</h2>
          <p className="text-gray-600">当社は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供いたしません。ただし、決済処理のためにStripe社に請求情報を提供する場合があります。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. データの保存</h2>
          <p className="text-gray-600">フロアのレイアウトデータはサーバー上で管理されます。チャットやDMの会話内容はサーバーに保存されず、リアルタイムの通信のみで処理されます。利用者はフロアの削除により関連データを削除できます。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Cookieの利用</h2>
          <p className="text-gray-600">本サービスでは、フロアの訪問履歴や設定を保存するためにブラウザのlocalStorageを利用しています。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. お問い合わせ</h2>
          <p className="text-gray-600">プライバシーに関するお問い合わせは、サービス内のお問い合わせ窓口までご連絡ください。</p>
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
