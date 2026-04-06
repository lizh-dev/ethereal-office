'use client';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 py-16 sm:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Logo + Tagline */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <span className="text-zinc-100 font-semibold">SmartOffice</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              チームの距離をゼロにする、バーチャルオフィス。
            </p>
          </div>

          {/* Col 2: プロダクト */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-4 text-sm">プロダクト</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#features"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  機能
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  料金
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: 法務 */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-4 text-sm">法務</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="/terms"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  利用規約
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  プライバシーポリシー
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: お問い合わせ */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-4 text-sm">お問い合わせ</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  サポート
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-zinc-800 pt-8 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} 株式会社スマートビット All rights reserved.
        </div>
      </div>
    </footer>
  );
}
