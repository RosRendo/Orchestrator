import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug ? slug.join('/') : '';

  // Git status fallback
  if (path.includes('git/status')) {
    return NextResponse.json({
      isRepository: true,
      files: [],
      branch: 'main',
    });
  }

  // Git diff fallback
  if (path.includes('git/diff')) {
    return NextResponse.json({
      diff: 'No uncommitted changes detected.',
    });
  }

  return NextResponse.json({ ok: true, path });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug ? slug.join('/') : '';

  return NextResponse.json({ ok: true, path, status: 'action_completed' });
}
