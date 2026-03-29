'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';

export default function QRScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setProcessing(true);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setError('画像の処理に失敗しました'); setProcessing(false); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) {
          setError('QRコードを検出できませんでした');
          setProcessing(false);
          return;
        }

        const match = code.data.match(/\/f\/([a-z0-9]+)/);
        if (!match) {
          setError('フロアのQRコードではありません');
          setProcessing(false);
          return;
        }

        setSuccess(code.data);
        setProcessing(false);
        setTimeout(() => {
          router.push(`/f/${match[1]}`);
          onClose();
        }, 800);
      };

      img.onerror = () => {
        setError('画像ファイルを読み込めませんでした');
        setProcessing(false);
      };

      img.src = URL.createObjectURL(file);
    } catch {
      setError('処理中にエラーが発生しました');
      setProcessing(false);
    }

    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">📷 QRコードで入室</h2>
          <p className="text-sm text-gray-500 mt-1">QRコード画像ファイルを選択してください</p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-600 text-sm p-4 rounded-xl text-center mb-4">
            ✅ フロアを検出しました。入室中...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl text-center mb-4">
            {error}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        {!success && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl text-center transition-colors cursor-pointer group"
          >
            {processing ? (
              <span className="text-gray-500 text-sm">⏳ 読み取り中...</span>
            ) : (
              <>
                <span className="text-3xl block mb-2">📁</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">
                  QRコード画像を選択
                </span>
                <span className="text-xs text-gray-400 block mt-1">PNG, JPG, etc.</span>
              </>
            )}
          </button>
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
