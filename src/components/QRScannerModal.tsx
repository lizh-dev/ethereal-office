'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QRScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [scannedUrl, setScannedUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Check if it's a valid floor URL
            const match = decodedText.match(/\/f\/([a-z0-9]+)/);
            if (match) {
              scanner.stop().catch(() => {});
              setScannedUrl(decodedText);
              setTimeout(() => {
                const slug = match[1];
                router.push(`/f/${slug}`);
                onClose();
              }, 500);
            }
          },
          () => {} // ignore scan failures
        );
      } catch {
        if (mounted) setError('カメラにアクセスできません');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      html5QrCodeRef.current?.stop?.().catch(() => {});
    };
  }, [router, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">📷 QRコードスキャン</h2>
          <p className="text-sm text-gray-500 mt-1">フロアのQRコードをかざしてください</p>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl text-center">
            {error}
            <p className="text-xs text-red-400 mt-2">カメラの権限を許可してください</p>
          </div>
        ) : scannedUrl ? (
          <div className="bg-green-50 text-green-600 text-sm p-4 rounded-xl text-center">
            ✅ フロアを検出しました。入室中...
          </div>
        ) : (
          <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden" />
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
