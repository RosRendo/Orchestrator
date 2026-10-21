import { NextRequest, NextResponse } from 'next/server';

let activeProjects = [
  {
    id: 'proj-orchestrator',
    name: 'RendoOS Orchestrator',
    path: 'Personal Project/Orchestrator',
    description: 'Personal and Business Founder Operating System.',
    stack: JSON.stringify(['Next.js', 'NestJS', 'TypeScript', 'Tailwind', 'AI']),
    tags: JSON.stringify(['Active', 'Production', 'Flagship']),
    deployTargets: JSON.stringify({ vercel: 'https://rendoos.vercel.app' }),
    agentConfig: JSON.stringify({ defaultAgent: 'hermes' }),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-telegram-bot',
    name: 'Telegram SaaS Bot',
    path: 'Personal Project/TelegramBot',
    description: 'Autonomous AI webhook dispatcher for Telegram.',
    stack: JSON.stringify(['Node.js', 'Telegraf', 'Prisma']),
    tags: JSON.stringify(['SaaS', 'Bot']),
    deployTargets: JSON.stringify({}),
    agentConfig: JSON.stringify({ defaultAgent: 'business' }),
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    projects: activeProjects,
    items: activeProjects,
  });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const newProj = {
    id: `proj-${Date.now()}`,
    name: body.name || 'New Project',
    path: body.path || 'projects/new',
    description: body.description || '',
    stack: JSON.stringify(body.stack || ['TypeScript']),
    tags: JSON.stringify(body.tags || ['MVP']),
    deployTargets: JSON.stringify({}),
    agentConfig: JSON.stringify({}),
    createdAt: new Date().toISOString(),
  };

  activeProjects.push(newProj);
  return NextResponse.json({ ok: true, project: newProj });
}
