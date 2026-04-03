'use client';

interface SSOLoginScreenProps {
  floorName: string;
  slug: string;
}

export default function SSOLoginScreen({ floorName, slug }: SSOLoginScreenProps) {
  const handleLogin = () => {
    window.location.href = `/api/floors/${slug}/sso/login`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #f5f3ff 100%)',
      padding: 16,
    }}>
      <div style={{
        maxWidth: 400,
        width: '100%',
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F3E2;</div>
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1f2937',
          marginBottom: 8,
        }}>
          {floorName}
        </h1>
        <p style={{
          fontSize: 14,
          color: '#6b7280',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          このフロアはサインインが必要です
        </p>
        <button
          onClick={handleLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px 24px',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.background = '#f9fafb';
            (e.target as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.background = '#ffffff';
            (e.target as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Googleでサインイン
        </button>
        <p style={{
          fontSize: 11,
          color: '#9ca3af',
          marginTop: 24,
        }}>
          サインインすると、フロアに入室できます
        </p>
      </div>
    </div>
  );
}
