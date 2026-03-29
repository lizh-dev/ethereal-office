'use client';

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-200 py-12 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-gray-800 font-semibold">Ethereal Office</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors duration-300">
              GitHub
            </a>
            <a href="#" className="hover:text-sky-500 transition-colors duration-300">
              お問い合わせ
            </a>
            <a href="#" className="hover:text-sky-500 transition-colors duration-300">
              プライバシー
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Ethereal Office. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
