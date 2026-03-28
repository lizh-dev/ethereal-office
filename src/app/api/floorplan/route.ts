import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'floorplan.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: 'Floor plan not found' },
      { status: 404 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure data directory exists
    const dir = path.dirname(DATA_PATH);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(DATA_PATH, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save floor plan', details: String(error) },
      { status: 500 },
    );
  }
}
