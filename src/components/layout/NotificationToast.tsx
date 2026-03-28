'use client';

import { useEffect, useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';

interface ToastItem {
  id: string;
  text: string;
  entering: boolean;
  exiting: boolean;
}

export default function NotificationToast() {
  const notifications = useOfficeStore((s) => s.notifications);
  const removeNotification = useOfficeStore((s) => s.removeNotification);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync notifications from store into local toast state with animation flags
  useEffect(() => {
    setToasts((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newIds = new Set(notifications.map((n) => n.id));

      // Mark removed items as exiting
      const updated = prev.map((t) =>
        !newIds.has(t.id) ? { ...t, exiting: true } : { ...t, entering: false }
      );

      // Add new items
      for (const n of notifications) {
        if (!existingIds.has(n.id)) {
          updated.push({ id: n.id, text: n.text, entering: true, exiting: false });
        }
      }

      return updated.slice(-3); // max 3 visible
    });
  }, [notifications]);

  // Clean up exiting toasts after animation
  useEffect(() => {
    const exitingToasts = toasts.filter((t) => t.exiting);
    if (exitingToasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => !t.exiting));
    }, 300);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Mark entering toasts as settled after mount
  useEffect(() => {
    const enteringToasts = toasts.filter((t) => t.entering);
    if (enteringToasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.map((t) => ({ ...t, entering: false })));
    }, 50);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            animation: toast.exiting
              ? 'toast-exit 0.3s ease-in forwards'
              : toast.entering
              ? undefined
              : 'toast-enter 0.3s ease-out',
            opacity: toast.entering ? 0 : undefined,
            transform: toast.entering ? 'translateY(-8px)' : undefined,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 backdrop-blur-sm max-w-[400px]"
            style={{ background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <span className="text-[12px] text-gray-700 font-medium truncate">{toast.text}</span>
            <button
              onClick={() => removeNotification(toast.id)}
              className="text-gray-300 hover:text-gray-500 text-[10px] flex-shrink-0 ml-1 transition-colors"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
