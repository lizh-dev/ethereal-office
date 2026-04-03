'use client';

import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { useOfficeStore } from '@/store/officeStore';
import { getTemplateElements, TEMPLATE_META } from '@/lib/templates';
import { initSeatsFromElements } from '@/lib/seatDetection';
import FeatureGate from '@/components/plan/FeatureGate';

export default function TemplatePicker({ onClose }: { onClose: () => void }) {
  const excalidrawAPI = useOfficeStore((s) => s.excalidrawAPI);

  const handleSelect = (templateId: string) => {
    if (!excalidrawAPI) return;

    const rawElements = getTemplateElements(templateId);

    try {
      const converted = convertToExcalidrawElements(
        rawElements as Parameters<typeof convertToExcalidrawElements>[0]
      );
      excalidrawAPI.updateScene({ elements: converted });
      initSeatsFromElements(converted);
    } catch (e) {
      console.error('Failed to apply template:', e);
    }

    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        width: '100%', maxWidth: 480, margin: '0 16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>
            テンプレートを選択
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: '#9ca3af', padding: 4, lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content gated behind Pro */}
        <FeatureGate feature="floorTemplates">
          <div style={{ padding: 24 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
              {TEMPLATE_META.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl.id)}
                  disabled={!excalidrawAPI}
                  style={{
                    padding: 16, borderRadius: 12,
                    border: '1px solid #e5e7eb', background: '#fff',
                    cursor: excalidrawAPI ? 'pointer' : 'not-allowed',
                    textAlign: 'left', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#a5b4fc';
                    e.currentTarget.style.background = '#eef2ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <span style={{ fontSize: 24 }}>{tmpl.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                    {tmpl.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                    {tmpl.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}
