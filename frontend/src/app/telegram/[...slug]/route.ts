import { NextRequest, NextResponse } from 'next/server';

let telegramConfig = {
  enabled: true,
  botUsername: 'RendoOSBot',
  configured: true,
};

export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    running: telegramConfig.enabled,
    configured: telegramConfig.configured,
    botUsername: telegramConfig.botUsername,
    message: 'Telegram service operational.',
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug ? slug.join('/') : '';
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  if (path === 'toggle') {
    telegramConfig.enabled = !telegramConfig.enabled;
    return NextResponse.json({ ok: true, running: telegramConfig.enabled });
  }

  if (path === 'config') {
    if (body.botToken) {
      telegramConfig.configured = true;
    }
    return NextResponse.json({ ok: true, config: telegramConfig });
  }

  return NextResponse.json({ ok: true });
}
