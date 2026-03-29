'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface QRCodeModalProps {
  url: string;
  floorName: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, floorName, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById('floor-qrcode');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `${floorName}-qrcode.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{floorName}</h2>
          <p className="text-sm text-gray-500 mt-1">QRコードを読み取って入室</p>
        </div>

        <div className="flex justify-center mb-6 p-4 bg-white rounded-xl border border-gray-100">
          <QRCodeSVG
            id="floor-qrcode"
            value={url}
            size={240}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#1e1b4b"
          />
        </div>

        <div className="text-center text-xs text-gray-400 mb-4 break-all px-4">
          {url}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
          >
            {copied ? '✓ コピー済み' : '🔗 URLコピー'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors"
          >
            📥 画像保存
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
