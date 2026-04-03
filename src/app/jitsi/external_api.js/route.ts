export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const jitsiUrl = process.env.NEXT_PUBLIC_JITSI_URL || 'https://localhost:8443';
  const isHttps = jitsiUrl.startsWith('https');
  try {
    const mod = isHttps ? await import('node:https') : await import('node:http');
    const body = await new Promise<string>((resolve, reject) => {
      const req = mod.get(`${jitsiUrl}/external_api.js`, { rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    });
    return new Response(body, {
      headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[jitsi-proxy] Failed:', msg);
    return new Response(`// Jitsi API error: ${msg}`, {
      status: 502,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
}
