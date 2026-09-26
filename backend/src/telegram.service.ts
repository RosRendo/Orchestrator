import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { ProjectsService } from './projects.service';
import { PrismaService } from './prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { exec, spawn } from 'child_process';


const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, '.agents', 'telegram_config.json');

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf | null = null;
  private activeConfig: { token: string; allowedChatId: string; active: boolean } = {
    token: '',
    allowedChatId: '',
    active: false
  };
  private runningServers = new Map<string, { frontend?: any; backend?: any }>();

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService
  ) {}


  onModuleInit() {
    this.initializeBot();
  }

  onModuleDestroy() {
    this.stopBot();
  }

  public getStatus() {
    return {
      active: !!this.bot,
      tokenConfigured: !!this.activeConfig.token,
      allowedChatId: this.activeConfig.allowedChatId || 'Not set',
      enabled: this.activeConfig.active
    };
  }

  public updateConfig(token: string, allowedChatId: string, active: boolean) {
    let finalToken = token;
    if (token === '••••••••••••••••••••' || !token) {
      try {
        if (fs.existsSync(CONFIG_PATH)) {
          const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
          finalToken = config.token || '';
        }
      } catch {}
    }
    const config = { token: finalToken, allowedChatId, active };
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    this.initializeBot();
  }


  public initializeBot() {
    this.stopBot();

    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.activeConfig, null, 2), 'utf8');
        return;
      }

      const fileData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      this.activeConfig = {
        token: fileData.token || '',
        allowedChatId: fileData.allowedChatId || '',
        active: !!fileData.active
      };

      if (!this.activeConfig.active || !this.activeConfig.token) {
        console.log('Telegram Bot service is disabled or token is missing in telegram_config.json.');
        return;
      }

      console.log('Starting Telegram bot service...');
      this.bot = new Telegraf(this.activeConfig.token);

      this.setupHandlers();
      this.bot.launch().catch(err => {
        console.error('Failed to launch Telegram Bot:', err.message);
        this.bot = null;
      });
    } catch (e: any) {
      console.error('Error during Telegram bot initialization:', e.message);
    }
  }

  private stopBot() {
    if (this.bot) {
      try {
        this.bot.stop('SIGINT');
      } catch {}
      this.bot = null;
    }
  }

  private isAuthorized(ctx: any): boolean {
    const chatId = String(ctx.chat?.id || '');
    const configuredId = String(this.activeConfig.allowedChatId).trim();
    if (!configuredId) {
      // If not configured, auto-authorize the first message but warn
      ctx.reply(`⚠️ Telegram Bot is not locked to a specific Chat ID. Locking to this Chat ID: ${chatId}. Save config to lock permanently.`);
      this.updateConfig(this.activeConfig.token, chatId, true);
      return true;
    }
    const authorized = chatId === configuredId;
    if (!authorized) {
      ctx.reply(`🚫 Unauthorized Chat ID: ${chatId}. Command rejected.`);
    }
    return authorized;
  }

  private async replySafe(ctx: any, text: string, extra: any = { parse_mode: 'Markdown' }) {
    try {
      return await ctx.reply(text, extra);
    } catch (err: any) {
      if (err.message && (err.message.includes("can't parse entities") || err.message.includes('Bad Request'))) {
        return await ctx.reply(text);
      }
      throw err;
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Register Telegram command autocomplete list
    try {
      this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the gateway and lock security details' },
        { command: 'skills', description: 'Browse 14 Skill Hub departments & detected agents' },
        { command: 'ask', description: 'Ask RendoOS universal brain: /ask {question}' },
        { command: 'learn', description: 'Ingest insight to Obsidian: /learn {observation}' },
        { command: 'hermes', description: 'Run Hermes dev agent: /hermes {prompt}' },
        { command: 'daily', description: 'RendoOS Morning Briefing & Priorities' },
        { command: 'daily_review', description: 'RendoOS Nightly Retrospective' },
        { command: 'models', description: 'Inspect active LLM providers and routing table' },
        { command: 'ai', description: 'Run domain specialist: /ai {domain} {prompt}' },
        { command: 'status', description: 'Query telemetry, server port bindings, and Docker' },
        { command: 'projects', description: 'List all registered projects and paths' },
        { command: 'docker', description: 'Check running compose stack containers' },
        { command: 'docker_start', description: 'Launch Docker Desktop daemon task' },
        { command: 'docker_stop', description: 'Terminate Docker Desktop engine' },
        { command: 'active_servers', description: 'List workspace servers active on the laptop' },
        { command: 'add_project', description: 'Add/register a project workspace folder path (name path)' },
        { command: 'start_frontend', description: 'Start frontend dev server for a project' },
        { command: 'start_backend', description: 'Start backend dev server for a project' },
        { command: 'stop_project', description: 'Stop running dev servers for a project' },
        { command: 'missions', description: 'List active task missions in the database' },
        { command: 'errors', description: 'List unresolved active Sentry issues' }
      ]);
    } catch (err: any) {
      console.error('Failed to register Telegram bot commands list:', err.message);
    }

    // Help / Start Command
    const sendHelp = (ctx: any) => {
      if (!this.isAuthorized(ctx)) return;
      this.replySafe(
        ctx,
        `🧠 *RendoOS Universal AI Operating Gateway* 🧠\n\n` +
        `Centralized Obsidian brain + Multi-Model dynamic routing on your mobile device.\n\n` +
        `*Universal Knowledge & Founder OS:*\n` +
        `• \`/business\` - View 10-stage Idea ➔ Business Pipeline.\n` +
        `• \`/idea {title}: {desc}\` - Capture new SaaS or venture hypothesis.\n` +
        `• \`/experience {action} | {result} | {lesson}\` - Log to immutable Experience Ledger.\n` +
        `• \`/skills\` - Browse 14 departments & detected Obsidian playbooks.\n` +
        `• \`/skills {domain}\` - Inspect specific agents (e.g. \`/skills engineering\`).\n` +
        `• \`/ask {question}\` - Query brain with Obsidian retrieval & model routing.\n` +
        `• \`/learn {insight}\` - Ingest real-world learning to Obsidian & AI Brain Sync.\n` +
        `• \`/hermes {prompt}\` - Hermes Developer & DevOps Agent (DeepSeek-Coder).\n` +
        `• \`/daily\` - Morning Briefing & Strategic Priorities.\n` +
        `• \`/daily_review\` - Nightly Retrospective & Obsidian Journaling.\n` +
        `• \`/models\` - Inspect active LLM providers & routing matrix.\n\n` +
        `*Domain Specialists (/ai {domain} {prompt}):*\n` +
        `• \`/ai sales {prompt}\` - Sales objection scripts & pricing strategy.\n` +
        `• \`/ai marketing {prompt}\` - Viral content hooks & SEO campaigns.\n` +
        `• \`/ai trading {prompt}\` - MT5 Python bridges & risk rules.\n` +
        `• \`/ai product {prompt}\` - Feature specifications & MVP scopes.\n` +
        `• \`/ai ops {prompt}\` - Standard Operating Procedures (SOPs).\n` +
        `• \`/ai comms {prompt}\` - Executive memos & client outreach.\n` +
        `• \`/ai coding {prompt}\` - Coding & backend debugging.\n` +
        `• \`/ai finance {prompt}\` - SaaS unit economics & cash flows.\n` +
        `• \`/ai research {prompt}\` - Market intelligence & competitor SWOT.\n\n` +
        `*Laptop & Project Control:*\n` +
        `• \`/status\` - Port bindings & machine telemetry.\n` +
        `• \`/projects\` - Registered project workspaces.\n` +
        `• \`/docker\` - Docker Compose containers.\n` +
        `• \`/missions\` - Database task missions.\n` +
        `• \`/errors\` - Unresolved Sentry issues.\n` +
        `• \`/add_project {name} {path}\` - Register workspace folder.\n` +
        `• \`/start_frontend {id}\` | \`/start_backend {id}\` - Boot dev servers.\n` +
        `• \`/hermes select {id} deploy\` - Run production builds.`
      );
    };

    this.bot.start(sendHelp);
    this.bot.command('help', sendHelp);

    // ─── RendoOS /models Command (Router & API Keys Status) ─────────────
    this.bot.command('models', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const hasKey = (key?: string) => key && key !== 'your_key_here' && key.trim() !== '';
      const deepseekOk = hasKey(process.env.DEEPSEEK_API_KEY);
      const claudeOk = hasKey(process.env.ANTHROPIC_API_KEY);
      const geminiOk = hasKey(process.env.GEMINI_API_KEY);
      const openaiOk = hasKey(process.env.OPENAI_API_KEY);

      const msg = `⚡ *RendoOS Model Router & Status*\n\n` +
        `*Configured Providers:*\n` +
        `• *DeepSeek (V3 / Coder):* ${deepseekOk ? '🟢 Connected (Active)' : '🔴 No Key'}\n` +
        `• *Claude 3.5 Sonnet:* ${claudeOk ? '🟢 Connected' : '⚪ Not Set (fallback to DeepSeek)'}\n` +
        `• *Gemini 2.0 Flash:* ${geminiOk ? '🟢 Connected' : '⚪ Not Set (fallback to DeepSeek)'}\n` +
        `• *OpenAI / GPT-4o:* ${openaiOk ? '🟢 Connected' : '⚪ Not Set'}\n\n` +
        `*Routing Matrix:*\n` +
        `• \`/hermes\` & Code/DevOps ➔ *DeepSeek-Coder*\n` +
        `• Sales / Copywriting ➔ *Claude 3.5 Sonnet* / *DeepSeek*\n` +
        `• Research / Ingest ➔ *Gemini 2.0 Flash* / *DeepSeek*\n` +
        `• Obsidian Skill Synthesis ➔ *DeepSeek-V3* (JSON Mode)`;
      this.replySafe(ctx, msg);
    });


    // Telemetry Status Command
    this.bot.command('status', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      await ctx.reply('Checking port binding systems...');
      
      const checkPort = (port: number): Promise<boolean> => {
        return new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(600);
          socket.on('connect', () => { socket.destroy(); resolve(true); });
          socket.on('timeout', () => { socket.destroy(); resolve(false); });
          socket.on('error', () => { socket.destroy(); resolve(false); });
          socket.connect(port, 'localhost');
        });
      };

      let dockerRunning = false;
      try {
        dockerRunning = await new Promise<boolean>((resolve) => {
          exec('docker info', { timeout: 1000 }, (err) => {
            resolve(!err);
          });
        });
      } catch {}

      const results = {
        frontend: await checkPort(3000),
        backend: await checkPort(3005),
        prisma: await checkPort(5555),
        n8n: await checkPort(5678),
      };

      ctx.reply(
        `🖥️ *Service Telemetry Status* 🖥️\n\n` +
        `• *Frontend (Next.js - 3000):* ${results.frontend ? '🟢 Active' : '🔴 Offline'}\n` +
        `• *Backend (NestJS - 3005):* ${results.backend ? '🟢 Active' : '🔴 Offline'}\n` +
        `• *Database (Prisma - 5555):* ${results.prisma ? '🟢 Active' : '🔴 Offline'}\n` +
        `• *Workflows (n8n - 5678):* ${results.n8n ? '🟢 Active' : '🔴 Offline'}\n\n` +
        `🐋 *Docker Desktop Daemon:* ${dockerRunning ? '🟢 Running' : '🔴 Offline (Send /docker_start to launch)'}\n\n` +
        `🤖 *Local Agent Services:* Active & Listening`,
        { parse_mode: 'Markdown' }
      );
    });


    // List Projects with Interactive Action Buttons
    this.bot.command('projects', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      try {
        const list = await this.projectsService.listProjects();
        if (list.length === 0) {
          return ctx.reply('No active projects registered on Orchestrator dashboard.');
        }

        await ctx.reply(`📂 *Registered Workspaces (${list.length})*`, { parse_mode: 'Markdown' });

        for (const p of list) {
          const txt = `📁 *Project:* \`${p.name}\`\n📍 *Path:* \`${p.path}\``;
          
          const keyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback('🚀 Start FE', `startfe_${p.id}`),
              Markup.button.callback('⚙️ Start BE', `startbe_${p.id}`)
            ],
            [
              Markup.button.callback('🛑 Stop Servers', `stop_${p.id}`),
              Markup.button.callback('📦 Deploy Build', `deploy_${p.id}`)
            ]
          ]);

          await ctx.reply(txt, { parse_mode: 'Markdown', ...keyboard });
        }
      } catch (err: any) {
        ctx.reply(`Failed to load projects: ${err.message}`);
      }
    });


    // Docker Status
    this.bot.command('docker', (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      exec('docker compose ps --format json', { cwd: PROJECT_ROOT }, (err, stdout) => {
        if (err) {
          return ctx.reply(`Docker daemon checking failed: ${err.message}`);
        }
        try {
          if (!stdout.trim()) {
            return ctx.reply('No active Docker containers running in Orchestrator compose stack.');
          }
          const lines = stdout.split('\n').filter(Boolean);
          let txt = `🐋 *Compose Container Status* 🐋\n\n`;
          lines.forEach((line) => {
            const parsed = JSON.parse(line);
            txt += `• *Name:* ${parsed.Name}\n  *State:* ${parsed.State === 'running' ? '🟢 running' : '🔴 ' + parsed.State}\n  *Ports:* ${parsed.Publishers?.[0]?.PublishedPort || 'none'}\n\n`;
          });
          ctx.reply(txt, { parse_mode: 'Markdown' });
        } catch {
          ctx.reply(`Docker containers status raw logs:\n\`\`\`\n${stdout.substring(0, 1000)}\n\`\`\``, { parse_mode: 'Markdown' });
        }
      });
    });

    // Start Docker Desktop
    this.bot.command('docker_start', (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      ctx.reply('Starting Docker Desktop binary...');
      const dockerPath = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
      if (fs.existsSync(dockerPath)) {
        const child = exec(`"${dockerPath}"`);
        child.unref();
        ctx.reply('Docker launch command detached and executed. Watch status in /docker.');
      } else {
        ctx.reply('Docker Desktop binary path could not be resolved on local disk.');
      }
    });

    // Stop Docker Desktop
    this.bot.command('docker_stop', (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      ctx.reply('Stopping Docker Desktop engine on laptop...');
      exec('taskkill /f /im "Docker Desktop.exe" /im "com.docker.backend.exe"', (err) => {
        ctx.reply('Docker close command executed. Verify status using /status.');
      });
    });


    // Run Hermes coding agent command - "/hermes {prompt}"
    this.bot.hears(/^\/hermes\s+(?!select\s)(.+)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const prompt = ctx.match[1];

      try {
        const projects = await this.projectsService.listProjects();
        if (projects.length === 0) {
          return ctx.reply('❌ No workspace projects registered. Please add a project first using `/add_project`.');
        }
        const project = projects[0];

        ctx.reply(`🤖 *Launching local Hermes agent...*\n📍 Workspace: \`${project.name}\`\n💬 Prompt: "${prompt}"\n\n*Running code edits...*`, { parse_mode: 'Markdown' });

        const cmd = 'C:\\Users\\ROS RENDO\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe';
        
        const agentProcess = spawn(cmd, ['-z', prompt, '--in', project.path], {
          cwd: project.path,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'UTF-8',
            DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-945e29a60b1b4fd7a3253623010ddace',
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-945e29a60b1b4fd7a3253623010ddace'
          }
        });

        let output = '';
        let errorOutput = '';

        agentProcess.stdout.on('data', (chunk: Buffer) => {
          output += chunk.toString('utf-8');
        });

        agentProcess.stderr.on('data', (chunk: Buffer) => {
          errorOutput += chunk.toString('utf-8');
        });

        agentProcess.on('close', (code: number) => {
          if (code === 0) {
            const cleanOutput = output.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''); // strip ANSI colors
            const summary = cleanOutput.length > 3000 ? cleanOutput.substring(0, 3000) + '\n\n*(Truncated due to length)*' : cleanOutput;
            ctx.reply(`✅ *Hermes Execution Complete!*\n\n${summary || 'Changes completed successfully.'}`, { parse_mode: 'Markdown' });
          } else {
            const cleanErr = errorOutput.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''); // strip ANSI colors
            ctx.reply(`❌ *Hermes failed with exit code ${code}*:\n\`\`\`\n${cleanErr.substring(0, 1000) || 'Unknown error'}\n\`\`\``, { parse_mode: 'Markdown' });
          }
        });

      } catch (e: any) {
        ctx.reply(`❌ Error running Hermes: ${e.message}`);
      }
    });

    // Deploy Controller Handler - "/hermes select {projectId} deploy"
    this.bot.hears(/^\/hermes\s+select\s+(\S+)\s+deploy$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const targetProjId = ctx.match[1];
      await ctx.reply(`Deploy pipeline activated for target project: \`${targetProjId}\`...`, { parse_mode: 'Markdown' });

      try {
        const project = await this.projectsService.getProject(targetProjId);
        ctx.reply(`Workspace loaded: \`${project.name}\`\nRunning builds & assets compilations...`, { parse_mode: 'Markdown' });

        // Run standard deploy check: build and status verify
        exec('npm run build', { cwd: project.path }, (err, stdout, stderr) => {
          if (err) {
            return ctx.reply(
              `❌ *Deployment compilation failed* ❌\n\n` +
              `*Stderr logs:*\n\`\`\`\n${stderr.substring(0, 500) || err.message}\n\`\`\``,
              { parse_mode: 'Markdown' }
            );
          }
          ctx.reply(
            `🟢 *Deployment compilation successful!* 🟢\n\n` +
            `*Stdout compilation logs:*\n\`\`\`\n${stdout.substring(0, 500) || 'Build assets ready.'}\n\`\`\``,
            { parse_mode: 'Markdown' }
          );
        });
      } catch (e: any) {
        ctx.reply(`Error targeting workspace ID: ${e.message}`);
      }
    });

    // Start Frontend Server
    this.bot.hears(/^\/start_frontend(?:\s+(\S+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      let projId = ctx.match[1];
      if (!projId) {
        const list = await this.projectsService.listProjects();
        if (list.length === 0) return ctx.reply('No active projects registered on dashboard.');
        if (list.length === 1) {
          projId = list[0].id;
        } else {
          return ctx.reply('Select project to start frontend:', Markup.inlineKeyboard(
            list.map(p => Markup.button.callback(`🚀 Start FE: ${p.name}`, `startfe_${p.id}`))
          ));
        }
      }
      await this.startProjectServices(projId, 'frontend', ctx);
    });

    // Start Backend Server
    this.bot.hears(/^\/start_backend(?:\s+(\S+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      let projId = ctx.match[1];
      if (!projId) {
        const list = await this.projectsService.listProjects();
        if (list.length === 0) return ctx.reply('No active projects registered on dashboard.');
        if (list.length === 1) {
          projId = list[0].id;
        } else {
          return ctx.reply('Select project to start backend:', Markup.inlineKeyboard(
            list.map(p => Markup.button.callback(`⚙️ Start BE: ${p.name}`, `startbe_${p.id}`))
          ));
        }
      }
      await this.startProjectServices(projId, 'backend', ctx);
    });

    // Stop Project servers
    this.bot.hears(/^\/stop_project(?:\s+(\S+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      let projId = ctx.match[1];
      if (!projId) {
        const list = await this.projectsService.listProjects();
        if (list.length === 0) return ctx.reply('No active projects registered on dashboard.');
        if (list.length === 1) {
          projId = list[0].id;
        } else {
          return ctx.reply('Select project to stop services:', Markup.inlineKeyboard(
            list.map(p => Markup.button.callback(`🛑 Stop: ${p.name}`, `stop_${p.id}`))
          ));
        }
      }
      await this.stopProjectServices(projId, ctx);
    });

    // Run Mission Command
    this.bot.hears(/^\/run_mission(?:\s+(\S+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      let missionId = ctx.match[1];
      if (!missionId) {
        const list = await this.prisma.mission.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
        if (list.length === 0) {
          return ctx.reply('No task missions found in database.');
        }
        if (list.length === 1) {
          missionId = list[0].id;
        } else {
          return ctx.reply('Select mission to execute:', Markup.inlineKeyboard(
            list.map(m => Markup.button.callback(`▶ Run: ${m.title}`, `runmission_${m.id}`))
          ));
        }
      }
      try {
        const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
        if (!mission) return ctx.reply('Mission not found.');
        
        await this.projectsService.runMission(missionId);
        ctx.reply(`✅ *Started execution mission:* ${mission.title}`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        ctx.reply(`Failed to start mission: ${err.message}`);
      }
    });

    // Sentry Auto-Fix Command
    this.bot.hears(/^\/autofix(?:\s+(\S+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      let issueId = ctx.match[1];
      if (!issueId) {
        const mockSentryIssues = [
          { id: 'issue-sentry-1', title: 'Payment webhook failed', severity: 'Critical', analysis: 'Missing HMAC verification signature validation on Stripe raw request payloads.', fix: 'payment.service.ts line 230' },
          { id: 'issue-sentry-2', title: 'PostgreSQL connection pool exhausted', severity: 'High', analysis: 'DB pool clients are not being released inside transient transactions. Sockets are held open.', fix: 'prisma.service.ts line 45' },
          { id: 'issue-sentry-3', title: 'ReferenceError: window is not defined', severity: 'Medium', analysis: 'Server-side pre-rendering execution attempts to access client-only window objects.', fix: 'page.tsx line 4402' }
        ];
        return ctx.reply('Select Sentry issue to auto-fix with Hermes:', Markup.inlineKeyboard(
          mockSentryIssues.map(i => Markup.button.callback(`🤖 Fix: ${i.title}`, `autofix_${i.id}`))
        ));
      }
      try {
        const mockSentryIssues = [
          { id: 'issue-sentry-1', title: 'Payment webhook failed', severity: 'Critical', analysis: 'Missing HMAC verification signature validation on Stripe raw request payloads.', fix: 'payment.service.ts line 230' },
          { id: 'issue-sentry-2', title: 'PostgreSQL connection pool exhausted', severity: 'High', analysis: 'DB pool clients are not being released inside transient transactions. Sockets are held open.', fix: 'prisma.service.ts line 45' },
          { id: 'issue-sentry-3', title: 'ReferenceError: window is not defined', severity: 'Medium', analysis: 'Server-side pre-rendering execution attempts to access client-only window objects.', fix: 'page.tsx line 4402' }
        ];
        const issue = mockSentryIssues.find(i => i.id === issueId);
        if (!issue) return ctx.reply('Sentry issue not found.');

        const projects = await this.projectsService.listProjects();
        const projectId = projects && projects.length > 0 ? projects[0].id : null;

        const mission = await this.prisma.mission.create({
          data: {
            title: `Fix: ${issue.title} (${issue.severity})`,
            status: 'pending',
            agentId: 'hermes',
            projectId: projectId,
            steps: JSON.stringify([]),
            report: `# Sentry Error Fix Mission\n\n- **Issue**: \`${issue.title}\`\n- **Severity**: \`${issue.severity}\`\n- **Analysis**: ${issue.analysis}\n- **Target File**: \`${issue.fix}\`\n\n*Pending agent start trigger.*`
          }
        });

        await this.projectsService.runMission(mission.id);
        ctx.reply(`🤖 *Hermes Auto-Fix Triggered!*\n\nCreated mission *${mission.title}* and started resolving. Use \`/missions\` to track status.`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        ctx.reply(`Auto-fix failed: ${err.message}`);
      }
    });

    // Active servers list
    this.bot.command('active_servers', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      if (this.runningServers.size === 0) {
        return ctx.reply('No project servers are currently running via the Telegram bot.');
      }
      let txt = `⚡ *Active Project Servers* ⚡\n\n`;
      for (const [id, proc] of this.runningServers.entries()) {
        try {
          const project = await this.projectsService.getProject(id);
          txt += `• *Project:* \`${project.name}\`\n  *Frontend:* ${proc.frontend ? '🟢 Running' : '🔴 Stopped'}\n  *Backend:* ${proc.backend ? '🟢 Running' : '🔴 Stopped'}\n\n`;
        } catch {}
      }
      ctx.reply(txt, { parse_mode: 'Markdown' });
    });

    // Add/register new Project command - "/add_project {name} {path}"
    this.bot.hears(/^\/add_project\s+(\S+)\s+(.+)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const name = ctx.match[1];
      const folderPath = ctx.match[2].trim();

      await ctx.reply(`Adding project \`${name}\` at path \`${folderPath}\` to database...`, { parse_mode: 'Markdown' });

      try {
        const created = await this.projectsService.createProject(name, folderPath);
        ctx.reply(
          `🟢 *Project registered successfully!* 🟢\n\n` +
          `• *Name:* \`${created.name}\`\n` +
          `• *ID:* \`${created.id}\`\n` +
          `• *Path:* \`${created.path}\`\n\n` +
          `You can now start frontend/backend services using the buttons in /projects or:\n` +
          `\`/start_frontend ${created.id}\`\n` +
          `\`/start_backend ${created.id}\``,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        ctx.reply(`❌ *Failed to register project:* ${err.message}`);
      }
    });

    // --- Sentry Issues & Task Missions Integration ---

    // Missions list command
    this.bot.command('missions', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      try {
        const list = await this.prisma.mission.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
        if (list.length === 0) return ctx.reply('No task missions found in database.');
        
        await ctx.reply('🎯 *Recent Task Missions:*', { parse_mode: 'Markdown' });
        
        for (const m of list) {
          const statusEmoji = m.status === 'completed' ? '✅' : m.status === 'running' ? '⟳' : '⚪';
          const txt = `${statusEmoji} *${m.title}*\n` +
                      `   • Agent: \`${m.agentId.toUpperCase()}\`\n` +
                      `   • Status: \`${m.status}\`\n` +
                      `   • ID: \`${m.id}\``;

          const keyboard = Markup.inlineKeyboard([
            m.status === 'pending' || m.status === 'failed' ? Markup.button.callback('▶ Run Mission', `runmission_${m.id}`) :
            Markup.button.callback('⟳ Re-run Mission', `runmission_${m.id}`)
          ]);

          await ctx.reply(txt, { parse_mode: 'Markdown', ...keyboard });
        }
      } catch (e: any) {
        ctx.reply(`Error loading missions: ${e.message}`);
      }
    });

    // Run mission execution trigger - "/run_mission {id}"
    this.bot.hears(/^\/run_mission\s+(\S+)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const missionId = ctx.match[1];
      try {
        const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
        if (!mission) return ctx.reply('Mission not found.');
        
        await this.projectsService.runMission(missionId);
        ctx.reply(`✅ Triggered execution mission for: *${mission.title}* via \`${mission.agentId.toUpperCase()}\`.`, { parse_mode: 'Markdown' });
      } catch (e: any) {
        ctx.reply(`Failed to start mission: ${e.message}`);
      }
    });

    // Active errors list command
    this.bot.command('errors', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      try {
        const mockSentryIssues = [
          { id: 'issue-sentry-1', title: 'Payment webhook failed', severity: 'Critical', fix: 'payment.service.ts line 230' },
          { id: 'issue-sentry-2', title: 'PostgreSQL connection pool exhausted', severity: 'High', fix: 'prisma.service.ts line 45' },
          { id: 'issue-sentry-3', title: 'ReferenceError: window is not defined', severity: 'Medium', fix: 'page.tsx line 4402' }
        ];

        await ctx.reply(`🔥 *Active Sentry Issues (${mockSentryIssues.length}):*`, { parse_mode: 'Markdown' });

        for (const err of mockSentryIssues) {
          const txt = `🔥 *Issue:* \`${err.title}\`\n🚨 *Severity:* \`${err.severity}\`\n📍 *File Location:* \`${err.fix}\``;
          
          const keyboard = Markup.inlineKeyboard([
            Markup.button.callback('🤖 Auto-Fix with Hermes', `autofix_${err.id}`)
          ]);

          await ctx.reply(txt, { parse_mode: 'Markdown', ...keyboard });
        }
      } catch (e: any) {
        ctx.reply(`Error querying active issues: ${e.message}`);
      }
    });

    // Auto-fix trigger command - "/autofix {issueId}"
    this.bot.hears(/^\/autofix\s+(\S+)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const issueId = ctx.match[1];
      try {
        const mockSentryIssues = [
          { id: 'issue-sentry-1', title: 'Payment webhook failed', severity: 'Critical', analysis: 'Missing HMAC verification signature validation on Stripe raw request payloads.', fix: 'payment.service.ts line 230' },
          { id: 'issue-sentry-2', title: 'PostgreSQL connection pool exhausted', severity: 'High', analysis: 'DB pool clients are not being released inside transient transactions. Sockets are held open.', fix: 'prisma.service.ts line 45' },
          { id: 'issue-sentry-3', title: 'ReferenceError: window is not defined', severity: 'Medium', analysis: 'Server-side pre-rendering execution attempts to access client-only window objects.', fix: 'page.tsx line 4402' }
        ];
        const issue = mockSentryIssues.find(i => i.id === issueId);
        if (!issue) return ctx.reply('Sentry issue not found.');

        const projects = await this.projectsService.listProjects();
        const projectId = projects && projects.length > 0 ? projects[0].id : null;

        const mission = await this.prisma.mission.create({
          data: {
            title: `Fix: ${issue.title} (${issue.severity})`,
            status: 'pending',
            agentId: 'hermes',
            projectId: projectId,
            steps: JSON.stringify([]),
            report: `# Sentry Error Fix Mission\n\n- **Issue**: \`${issue.title}\`\n- **Severity**: \`${issue.severity}\`\n- **Analysis**: ${issue.analysis}\n- **Target File**: \`${issue.fix}\`\n\n*Pending agent start trigger.*`
          }
        });

        await this.projectsService.runMission(mission.id);
        ctx.reply(`🤖 *Hermes Auto-Fix Triggered!*\n\nCreated mission *${mission.title}* and started resolving. Use \`/missions\` to track status.`, { parse_mode: 'Markdown' });
      } catch (e: any) {
        ctx.reply(`Auto-fix failed: ${e.message}`);
      }
    });

    // AI Workspace command: "/ai {agentId} {prompt}"
    this.bot.hears(/^\/ai\s+(\S+)\s+(.+)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const agentId = ctx.match[1].toLowerCase();
      const prompt = ctx.match[2];

      const validAgents = ['research', 'business', 'marketing', 'sales', 'finance', 'personal', 'coding', 'trading', 'product', 'ops', 'comms', 'hermes'];
      if (!validAgents.includes(agentId)) {
        return ctx.reply(`❌ Invalid agent. Choose from: ${validAgents.join(', ')}`);
      }

      ctx.reply(`🧠 *Running ${agentId.toUpperCase()} Agent*...\nPrompt: "${prompt}"\nPlease wait...`, { parse_mode: 'Markdown' });

      try {
        // Try calling the backend in LLM mode first
        let provider = 'openai';
        const hasKey = (key?: string) => key && key !== 'your_key_here' && key.trim() !== '';

        if (hasKey(process.env.DEEPSEEK_API_KEY)) {
          provider = 'deepseek';
        } else if (hasKey(process.env.OPENAI_API_KEY)) {
          provider = 'openai';
        } else if (hasKey(process.env.GEMINI_API_KEY)) {
          provider = 'gemini';
        } else if (hasKey(process.env.ANTHROPIC_API_KEY)) {
          provider = 'claude';
        }

        let res = await fetch(`http://localhost:${process.env.PORT ?? 3005}/automation/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            action: 'custom_query',
            prompt,
            mode: 'llm',
            provider
          })
        });

        let json = await res.json();
        
        // If LLM mode failed (e.g. no API key configured), retry in template mode
        if (!json.ok && (json.error?.includes('No API key') || json.error?.includes('key'))) {
          ctx.reply('⚠️ No LLM API keys configured in system. Running preset template analysis instead...', { parse_mode: 'Markdown' });
          res = await fetch(`http://localhost:${process.env.PORT ?? 3005}/automation/agent/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId,
              action: agentId === 'research' ? 'Web Research' : agentId === 'business' ? 'Startup Ideas' : agentId === 'marketing' ? 'SEO' : 'Schedule',
              prompt,
              mode: 'template'
            })
          });
          json = await res.json();
        }

        if (json.ok) {
          let replyText = `📄 *Execution Output (${agentId.toUpperCase()}):*\n\n`;
          const summary = json.result.length > 3000 ? json.result.substring(0, 3000) + '\n\n*(Truncated due to length)*' : json.result;
          replyText += summary;
          if (json.savedPath) {
            replyText += `\n\n✓ *Synced to Obsidian:* \`${json.savedPath}\``;
          }
          this.replySafe(ctx, replyText);
        } else {
          ctx.reply(`✗ Execution failed: ${json.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        ctx.reply(`✗ Connection error: ${e.message}`);
      }
    });

    // ─── RendoOS /learn Command (Mobile Knowledge Capture) ──────────────
    this.bot.hears(/^\/learn(?:\s+([\s\S]+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const thought = ctx.match[1]?.trim();
      if (!thought) {
        return ctx.reply('💡 *Usage:* `/learn {your insight, rule, or observation}`\n\n*Example:* `/learn Customers don\'t care about AI buzzwords, they care about getting their quote in 5 minutes.`', { parse_mode: 'Markdown' });
      }

      ctx.reply('🧠 *RendoOS Learning Engine*\nProcessing observation & categorizing into Obsidian vault...', { parse_mode: 'Markdown' });

      try {
        const port = process.env.PORT ?? 3005;
        const res = await fetch(`http://localhost:${port}/automation/learn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thought, source: 'Telegram' })
        });
        const json = await res.json() as any;

        if (json.ok) {
          const replyText = `✅ *Insight Synthesized & Stored!*\n\n` +
            `📁 *Domain:* \`${json.domain}\` → \`${json.category}\`\n` +
            `📌 *Title:* *${json.title}*\n` +
            `💡 *Core Principle:* ${json.principle}\n` +
            `⚡ *Actionable Rule:* ${json.actionableRule}\n\n` +
            `📚 *Vault Path:* \`${json.savedPath}\`\n` +
            `🪞 *Workspace Mirror:* \`${json.mirrorPath}\``;
          this.replySafe(ctx, replyText);
        } else {
          ctx.reply(`✗ Failed to store learning: ${json.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        ctx.reply(`✗ Connection error: ${e.message}`);
      }
    });

    // ─── RendoOS /ask Command (Universal Knowledge Query) ───────────────
    this.bot.hears(/^\/ask(?:\s+([\s\S]+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const query = ctx.match[1]?.trim();
      if (!query) {
        return ctx.reply('💡 *Usage:* `/ask {question or task}`\n\n*Example:* `/ask How should I validate my Telegram SaaS pricing model?`', { parse_mode: 'Markdown' });
      }

      ctx.reply(`🔍 *Querying RendoOS Brain...*\nSearching Obsidian vault & selecting optimal model...\nPlease wait...`, { parse_mode: 'Markdown' });

      try {
        const port = process.env.PORT ?? 3005;
        const res = await fetch(`http://localhost:${port}/automation/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const json = await res.json() as any;

        if (json.ok) {
          let replyText = `🧠 *RendoOS Answer* [Model: \`${json.provider.toUpperCase()}\`]:\n\n`;
          const answer = json.answer.length > 3000 ? json.answer.substring(0, 3000) + '\n\n*(Truncated due to length)*' : json.answer;
          replyText += answer;

          if (json.sources && json.sources.length > 0) {
            replyText += `\n\n📚 *Knowledge References:*\n` + json.sources.map((s: string) => `• \`${s}\``).join('\n');
          }
          this.replySafe(ctx, replyText);
        } else {
          ctx.reply(`✗ Failed to answer query: ${json.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        ctx.reply(`✗ Connection error: ${e.message}`);
      }
    });

    // ─── Dedicated /hermes Command (Developer & DevOps Agent) ───────────
    this.bot.hears(/^\/hermes(?:\s+([\s\S]+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const prompt = ctx.match[1]?.trim();
      if (!prompt) {
        return ctx.reply('🛠️ *Hermes Developer Agent*\n\nUsage: `/hermes {code task or query}`\n\n*Examples:*\n• `/hermes create a NestJS health check endpoint`\n• `/hermes check git status and pending commits`\n• `/hermes select {projectId} deploy`', { parse_mode: 'Markdown' });
      }

      if (prompt.startsWith('select ') && prompt.includes('deploy')) {
        const parts = prompt.split(' ');
        const projId = parts[1];
        try {
          const project = await this.projectsService.getProject(projId);
          ctx.reply(`📦 Running production build compilation for \`${project.name}\`...`, { parse_mode: 'Markdown' });
          exec('npm run build', { cwd: project.path }, (err, stdout, stderr) => {
            if (err) {
              return this.replySafe(ctx, `❌ *Build failed:*\n\`\`\`\n${stderr.substring(0, 500) || err.message}\n\`\`\``);
            }
            this.replySafe(ctx, `🟢 *Build successful!*\n\`\`\`\n${stdout.substring(0, 500)}\n\`\`\``);
          });
        } catch (e: any) {
          ctx.reply(`Deployment error: ${e.message}`);
        }
        return;
      }

      ctx.reply(`🤖 *Hermes Coding Agent Activated*\nTask: "${prompt}"\nRouting to DeepSeek-Coder...\nPlease wait...`, { parse_mode: 'Markdown' });

      try {
        const port = process.env.PORT ?? 3005;
        const res = await fetch(`http://localhost:${port}/automation/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'coding',
            action: 'Hermes Code Execution',
            prompt,
            mode: 'llm',
            provider: 'deepseek'
          })
        });

        const json = await res.json() as any;
        if (json.ok) {
          let replyText = `🛠️ *Hermes Engineering Output:*\n\n`;
          const summary = json.result.length > 3000 ? json.result.substring(0, 3000) + '\n\n*(Truncated due to length)*' : json.result;
          replyText += summary;
          if (json.savedPath) {
            replyText += `\n\n✓ *Synced to Obsidian:* \`${json.savedPath}\``;
          }
          this.replySafe(ctx, replyText);
        } else {
          ctx.reply(`✗ Hermes execution error: ${json.error || 'Unknown error'}`);
        }
      } catch (e: any) {
        ctx.reply(`✗ Connection error: ${e.message}`);
      }
    });

    // ─── RendoOS /daily Briefing Command ────────────────────────────────
    this.bot.command('daily', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;

      try {
        const missions = await this.prisma.mission.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' }
        });
        const activeMissions = missions.filter(m => m.status === 'pending' || m.status === 'running');
        const runningCount = this.runningServers.size;

        const briefing = `🌅 *GOOD MORNING RENDO — RendoOS Briefing* 🌅\n\n` +
          `📊 *System State:*\n` +
          `• Active Dev Servers: \`${runningCount} project(s)\`\n` +
          `• Open Task Missions: \`${activeMissions.length}\` pending\n\n` +
          `🎯 *Today's Strategic Priorities:*\n` +
          `1. 🚀 *Product & SaaS:* Validate first customer interview & onboarding funnel.\n` +
          `2. 📈 *Quant & Trading:* Check MT5 Python Bridge & London/NY session killzone.\n` +
          `3. 💰 *Sales Outreach:* Contact 5 qualified prospects with problem-first pitch.\n` +
          `4. 🧠 *Knowledge Capture:* Log lessons using \`/learn {insight}\`.\n\n` +
          `Use \`/ask\` for any question or \`/status\` to check server ports.`;

        this.replySafe(ctx, briefing);
      } catch (e: any) {
        ctx.reply(`Error generating daily briefing: ${e.message}`);
      }
    });

    // ─── RendoOS /daily_review Retrospective Command ────────────────────
    this.bot.command('daily_review', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;

      const reviewPrompt = `🌙 *RendoOS Nightly Retrospective* 🌙\n\n` +
        `Take 3 minutes to evaluate today's execution:\n\n` +
        `1. *What did you build today?*\n` +
        `2. *What breakthrough or lesson did you learn?*\n` +
        `3. *What broke or caused friction?*\n` +
        `4. *What is tomorrow's single #1 priority?*\n\n` +
        `👉 *Tip:* Reply with \`/learn Review: [Your thoughts]\` to record this directly into your Obsidian \`05_Daily/\` journal!`;

      this.replySafe(ctx, reviewPrompt);
    });

    // ─── RendoOS /skills Command (Skill Hub & Agent Directory) ───────────
    this.bot.hears(/^\/skills(?:\s+([a-zA-Z0-9_-]+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const targetCategory = ctx.match[1]?.toLowerCase().trim();

      try {
        const port = process.env.PORT ?? 3005;
        const res = await fetch(`http://localhost:${port}/automation/skills/catalog`);
        const data = await res.json() as any;

        if (!data.ok) {
          return ctx.reply(`✗ Failed to load skills catalog: ${data.error || 'Unknown error'}`);
        }

        const catalog: any[] = data.catalog || [];

        // If specific category requested (e.g. /skills engineering)
        if (targetCategory) {
          const foundCat = catalog.find(c => c.id === targetCategory || c.name.toLowerCase().includes(targetCategory));
          if (!foundCat) {
            const valid = catalog.map(c => `\`${c.id}\``).join(', ');
            return this.replySafe(ctx, `❌ Unknown department \`${targetCategory}\`.\n\n*Available departments:*\n${valid}`);
          }

          let msg = `${foundCat.icon} *Department: ${foundCat.name}*\n` +
            `📊 *Status:* \`${foundCat.detectedCount} detected\` · \`${foundCat.totalCatalogCount} total catalog\`\n\n` +
            `*Agents & Playbooks:*\n`;

          foundCat.agents.forEach((a: any) => {
            const statusIcon = a.detected ? '🟢 [Detected]' : '⚪ [Catalog]';
            msg += `• ${statusIcon} *${a.name}* (\`${a.id}\`)\n  ${a.description}\n`;
            if (a.filePath) msg += `  _Vault:_ \`${a.filePath}\`\n`;
          });

          msg += `\n👉 *To run an agent:* \`/ai ${foundCat.id} {task}\``;
          return this.replySafe(ctx, msg);
        }

        // Otherwise, show the full 14-department directory summary matching screenshot
        let summary = `🧩 *RendoOS Skill Hub & Agent Directory* 🧩\n` +
          `_Connected to Obsidian Vault: D:\\AI\\Obsidian_\n\n`;

        catalog.forEach((c: any) => {
          const detectedBadge = c.detectedCount > 0 ? ` · *${c.detectedCount} detected* 🟢` : '';
          summary += `${c.icon} *${c.name}:* ${c.totalCatalogCount} agents${detectedBadge}\n`;
        });

        summary += `\n📈 *Vault Status:* *${data.totalDetected} detected skills active* across *${data.totalCatalog} catalog templates*.\n\n` +
          `👉 *Browse specific department:* \`/skills {domain}\` (e.g. \`/skills engineering\`, \`/skills design\`, \`/skills sales\`)\n` +
          `👉 *Run any domain agent:* \`/ai {domain} {task}\``;

        this.replySafe(ctx, summary);
      } catch (err: any) {
        ctx.reply(`✗ Connection error: ${err.message}`);
      }
    });

    // ─── RendoOS /business & /pipeline Command ────────────────────────────────
    this.bot.hears(/^\/(business|pipeline)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      await ctx.sendChatAction('typing');

      try {
        const port = process.env.PORT || 3005;
        const res = await fetch(`http://localhost:${port}/automation/business/pipeline`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        let msg = `💼 *RendoOS Business & Idea Pipeline*\n\n`;
        msg += data.content.substring(0, 3000);
        msg += `\n\n👉 *Add a new venture hypothesis:* \`/idea Title: Description\``;
        this.replySafe(ctx, msg);
      } catch (err: any) {
        ctx.reply(`✗ Pipeline retrieval error: ${err.message}`);
      }
    });

    // ─── RendoOS /idea Command ────────────────────────────────────────────────
    this.bot.hears(/^\/idea(?:\s+(.+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const rawText = ctx.match[1]?.trim();
      if (!rawText) {
        return this.replySafe(
          ctx,
          `💡 *Usage:* \`/idea [Title]: [Description]\`\n\n` +
          `*Example:*\n` +
          `\`/idea Instant Quote SaaS: Automated SMS and Telegram quote generator for cleaning companies.\``
        );
      }

      await ctx.sendChatAction('typing');
      try {
        let title = rawText;
        let description = 'New venture hypothesis logged via Telegram.';
        if (rawText.includes(':')) {
          const parts = rawText.split(':');
          title = parts[0].trim();
          description = parts.slice(1).join(':').trim();
        }

        const port = process.env.PORT || 3005;
        const res = await fetch(`http://localhost:${port}/automation/business/idea`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, stage: 'Stage 1: 💡 Ideas' })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        this.replySafe(
          ctx,
          `✅ *New Venture Registered in Pipeline!*\n\n` +
          `💡 *Title:* ${title}\n` +
          `📝 *Hypothesis:* ${description}\n` +
          `📍 *Stage:* Stage 1 (Ideas)\n` +
          `📓 *Obsidian Path:* \`09_Business/${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md\``
        );
      } catch (err: any) {
        ctx.reply(`✗ Idea registration error: ${err.message}`);
      }
    });

    // ─── RendoOS /experience & /ledger Command ────────────────────────────────
    this.bot.hears(/^\/(?:experience|ledger)(?:\s+(.+))?$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const rawText = ctx.match[1]?.trim();
      if (!rawText) {
        // Show recent ledger
        try {
          const port = process.env.PORT || 3005;
          const res = await fetch(`http://localhost:${port}/automation/experience/ledger`);
          const data = await res.json();
          if (!data.ok) throw new Error(data.error);

          let msg = `📓 *RendoOS Experience Ledger*\n\n` + data.content.substring(0, 3000) +
            `\n\n👉 *Log an entry:* \`/experience Action | Result | Lesson\``;
          return this.replySafe(ctx, msg);
        } catch (err: any) {
          return ctx.reply(`✗ Ledger error: ${err.message}`);
        }
      }

      await ctx.sendChatAction('typing');
      try {
        const parts = rawText.split('|').map(p => p.trim());
        const action = parts[0] || 'Market Action';
        const result = parts[1] || 'Completed';
        const lesson = parts[2] || (parts[1] ? parts[1] : 'Valuable real-world experience gained.');

        const port = process.env.PORT || 3005;
        const res = await fetch(`http://localhost:${port}/automation/experience/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'Founder Execution',
            action,
            result,
            lesson,
            skillImpact: '+RealWorldExecution'
          })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        this.replySafe(
          ctx,
          `📓 *Logged to Immutable Experience Ledger!*\n\n` +
          `⚡ *Action:* ${action}\n` +
          `📊 *Result:* ${result}\n` +
          `💡 *Lesson:* ${lesson}\n` +
          `🧠 *Vault:* \`08_Experience/Ledger.md\` + AI Brain Sync`
        );
      } catch (err: any) {
        ctx.reply(`✗ Experience log error: ${err.message}`);
      }
    });

    // ─── RendoOS /briefing Command ──────────────────────────────────────────
    this.bot.hears(/^\/(briefing|morning)$/i, async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      await ctx.sendChatAction('typing');

      try {
        const port = process.env.PORT || 3005;
        const res = await fetch(`http://localhost:${port}/automation/briefing`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        this.replySafe(ctx, data.briefing);
      } catch (err: any) {
        ctx.reply(`✗ Briefing retrieval error: ${err.message}`);
      }
    });

    // Callback Query Handler for Interactive Action Buttons
    this.bot.on('callback_query', async (ctx) => {
      if (!this.isAuthorized(ctx)) return;
      const data = (ctx.callbackQuery as any).data;

      const match = data.match(/^([a-z]+)_(.+)$/);
      if (!match) return;

      const action = match[1];
      const projId = match[2];

      try {
        if (action === 'startfe') {
          await ctx.answerCbQuery('Starting Frontend...');
          await this.startProjectServices(projId, 'frontend', ctx);
        } else if (action === 'startbe') {
          await ctx.answerCbQuery('Starting Backend...');
          await this.startProjectServices(projId, 'backend', ctx);
        } else if (action === 'stop') {
          await ctx.answerCbQuery('Stopping Services...');
          await this.stopProjectServices(projId, ctx);
        } else if (action === 'deploy') {
          const project = await this.projectsService.getProject(projId);
          await ctx.answerCbQuery(`Building ${project.name}...`);
          ctx.reply(`📦 Running production build compilation on laptop for \`${project.name}\`...`, { parse_mode: 'Markdown' });
          exec('npm run build', { cwd: project.path }, (err, stdout, stderr) => {
            if (err) {
              return ctx.reply(`❌ *Build compilation failed* for \`${project.name}\`:\n\`\`\`\n${stderr.substring(0, 500) || err.message}\n\`\`\``, { parse_mode: 'Markdown' });
            }
            ctx.reply(`🟢 *Build compilation successful!* for \`${project.name}\`:\n\`\`\`\n${stdout.substring(0, 500)}\n\`\`\``, { parse_mode: 'Markdown' });
          });
        } else if (action === 'runmission') {
          await ctx.answerCbQuery('Running Mission...');
          const missionId = projId;
          const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
          if (!mission) return ctx.reply('Mission not found.');
          
          await this.projectsService.runMission(missionId);
          ctx.reply(`✅ *Started execution mission:* ${mission.title}`, { parse_mode: 'Markdown' });
        } else if (action === 'autofix') {
          await ctx.answerCbQuery('Running Hermes Auto-Fix...');
          const issueId = projId;
          const mockSentryIssues = [
            { id: 'issue-sentry-1', title: 'Payment webhook failed', severity: 'Critical', analysis: 'Missing HMAC verification signature validation on Stripe raw request payloads.', fix: 'payment.service.ts line 230' },
            { id: 'issue-sentry-2', title: 'PostgreSQL connection pool exhausted', severity: 'High', analysis: 'DB pool clients are not being released inside transient transactions. Sockets are held open.', fix: 'prisma.service.ts line 45' },
            { id: 'issue-sentry-3', title: 'ReferenceError: window is not defined', severity: 'Medium', analysis: 'Server-side pre-rendering execution attempts to access client-only window objects.', fix: 'page.tsx line 4402' }
          ];
          const issue = mockSentryIssues.find(i => i.id === issueId);
          if (!issue) return ctx.reply('Sentry issue not found.');

          const projects = await this.projectsService.listProjects();
          const projectId = projects && projects.length > 0 ? projects[0].id : null;

          const mission = await this.prisma.mission.create({
            data: {
              title: `Fix: ${issue.title} (${issue.severity})`,
              status: 'pending',
              agentId: 'hermes',
              projectId: projectId,
              steps: JSON.stringify([]),
              report: `# Sentry Error Fix Mission\n\n- **Issue**: \`${issue.title}\`\n- **Severity**: \`${issue.severity}\`\n- **Analysis**: ${issue.analysis}\n- **Target File**: \`${issue.fix}\`\n\n*Pending agent start trigger.*`
            }
          });

          await this.projectsService.runMission(mission.id);
          ctx.reply(`🤖 *Hermes Auto-Fix Triggered!*\n\nCreated mission *${mission.title}* and started resolving. Use \`/missions\` to track status.`, { parse_mode: 'Markdown' });
        }
      } catch (err: any) {
        ctx.reply(`Action failed: ${err.message}`);
      }
    });
  }

  private async startProjectServices(projId: string, type: 'frontend' | 'backend', ctx: any) {
    try {
      const project = await this.projectsService.getProject(projId);
      const hasStartBat = fs.existsSync(path.join(project.path, 'start_local.bat'));

      if (hasStartBat) {
        ctx.reply(`🚀 *Executing start_local.bat* on laptop for \`${project.name}\`...\n_(Starting Database, Backend, Frontend, and MT5 Python Bridge)_`, { parse_mode: 'Markdown' });
        // Execute batch command asynchronously in the background
        exec('cmd.exe /c start_local.bat', { cwd: project.path }, (err) => {
          if (err) {
            return ctx.reply(`🔴 *Failed to run start_local.bat:* ${err.message}`);
          }
        });
      } else {
        const cmd = type === 'frontend' ? 'npm run dev' : 'npm run start:dev';
        const existing = this.runningServers.get(projId);
        if (type === 'frontend' && existing?.frontend) {
          try { existing.frontend.kill(); } catch {}
        }
        if (type === 'backend' && existing?.backend) {
          try { existing.backend.kill(); } catch {}
        }

        ctx.reply(`🚀 Spawning ${type} server (\`${cmd}\`) for \`${project.name}\`...`, { parse_mode: 'Markdown' });
        const proc = exec(cmd, { cwd: project.path });
        this.runningServers.set(projId, { 
          ...(existing || {}), 
          [type]: proc 
        });

        proc.on('error', (err) => {
          ctx.reply(`🔴 ${type} server execution error for \`${project.name}\`: ${err.message}`);
        });

        setTimeout(() => {
          ctx.reply(`🟢 ${type} server for \`${project.name}\` initialized. Check active logs.`);
        }, 3000);
      }
    } catch (err: any) {
      ctx.reply(`Failed to start ${type}: ${err.message}`);
    }
  }

  private async stopProjectServices(projId: string, ctx: any) {
    try {
      const project = await this.projectsService.getProject(projId);
      const hasStopBat = fs.existsSync(path.join(project.path, 'stop_local.bat'));

      if (hasStopBat) {
        ctx.reply(`🛑 *Executing stop_local.bat* on laptop for \`${project.name}\`...\n_(Shutting down Docker containers & PM2 Python processes)_`, { parse_mode: 'Markdown' });
        exec('cmd.exe /c stop_local.bat', { cwd: project.path }, (err) => {
          if (err) {
            return ctx.reply(`🔴 *Failed to run stop_local.bat:* ${err.message}`);
          }
        });
      } else {
        const running = this.runningServers.get(projId);
        if (!running || (!running.frontend && !running.backend)) {
          return ctx.reply(`No active servers found running for project: \`${project.name}\`.`);
        }

        if (running.frontend) {
          try { running.frontend.kill(); } catch {}
        }
        if (running.backend) {
          try { running.backend.kill(); } catch {}
        }

        this.runningServers.delete(projId);
        ctx.reply(`🛑 All servers successfully stopped for project: \`${project.name}\`.`);
      }
    } catch (err: any) {
      ctx.reply(`Failed to stop project: ${err.message}`);
    }
  }
}

