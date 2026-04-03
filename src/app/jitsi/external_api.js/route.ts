export async function GET() {
  const jitsiUrl = process.env.NEXT_PUBLIC_JITSI_URL || 'https://localhost:8443';
  try {
    const res = await fetch(`${jitsiUrl}/external_api.js`, {
      // @ts-expect-error Node fetch option to skip TLS verification in dev
      agent: jitsiUrl.startsWith('https') ? new (await import('https')).Agent({ rejectUnauthorized: false }) : undefined,
    });
    const body = await res.text();
    return new Response(body, {
      headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    // Fallback: fetch from HTTP port
    try {
      const res = await fetch('http://localhost:8880/external_api.js');
      const body = await res.text();
      return new Response(body, {
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
      });
    } catch {
      return new Response('// Jitsi API not available', { status: 502, headers: { 'Content-Type': 'application/javascript' } });
    }
  }
}
