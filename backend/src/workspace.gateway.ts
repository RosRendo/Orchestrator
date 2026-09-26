import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectsService } from './projects.service';
import { PrismaService } from './prisma.service';
import { spawn as spawnProcess, ChildProcess } from 'child_process';
import * as pty from 'node-pty';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WorkspaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track active PTY processes per socket ID
  private shells = new Map<string, { process: pty.IPty; projectId: string }>();
  // Track active file watchers per socket ID
  private watchers = new Map<string, { watcher: chokidar.FSWatcher; projectId: string }>();

  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.cleanupTerminal(client.id);
    this.cleanupWatcher(client.id);
  }

  // --- TERMINAL EVENTS ---

  @SubscribeMessage('terminal:init')
  async handleTerminalInit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId?: string; cols?: number; rows?: number },
  ) {
    const { projectId, cols, rows } = data;
    this.cleanupTerminal(client.id); // clean up any existing terminal for this socket

    try {
      let terminalPath = process.cwd();
      let name = 'Orchestrator System';

      if (projectId && projectId !== 'system') {
        const project = await this.projectsService.getProject(projectId);
        terminalPath = project.path;
        name = project.name;
      }
      
      // Spawn a real PTY (ConPTY on Windows) so TUI apps work
      const isWin = process.platform === 'win32';
      const shellCmd = isWin ? 'powershell.exe' : 'bash';
      const shellArgs = isWin ? ['-NoLogo'] : ['-i'];

      console.log(`Spawning PTY terminal for project ${name} on path ${terminalPath}`);

      const ptyProcess = pty.spawn(shellCmd, shellArgs, {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: terminalPath,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'UTF-8',
          LANG: 'en_US.UTF-8',
          TERM: 'xterm-256color',
        } as Record<string, string>,
      });

      this.shells.set(client.id, { process: ptyProcess, projectId: projectId || 'system' });

      // Forward PTY output to client
      ptyProcess.onData((data: string) => {
        client.emit('terminal:output', data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        client.emit('terminal:output', `\n[Shell exited with code ${exitCode}]\n`);
        this.shells.delete(client.id);
      });

      // Send initial welcome message
      client.emit('terminal:output', `\rConnected to terminal for workspace: ${name}\n`);
    } catch (e) {
      client.emit('terminal:output', `Error initializing terminal: ${e.message}\n`);
    }
  }

  @SubscribeMessage('terminal:resize')
  handleTerminalResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cols: number; rows: number },
  ) {
    const shellInfo = this.shells.get(client.id);
    if (shellInfo && data.cols > 0 && data.rows > 0) {
      try {
        shellInfo.process.resize(data.cols, data.rows);
      } catch (e) {
        // Ignore resize errors (e.g. process already exited)
      }
    }
  }

  @SubscribeMessage('terminal:input')
  handleTerminalInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { input: string },
  ) {
    const shellInfo = this.shells.get(client.id);
    if (shellInfo) {
      try {
        shellInfo.process.write(data.input);
      } catch (e) {
        client.emit('terminal:output', `\n[Write error: ${e.message}]\n`);
      }
    } else {
      client.emit('terminal:output', `\n[No active terminal session]\n`);
    }
  }

  private cleanupTerminal(socketId: string) {
    const shellInfo = this.shells.get(socketId);
    if (shellInfo) {
      try {
        console.log(`Killing PTY process for socket: ${socketId}`);
        shellInfo.process.kill();
      } catch (e) {
        console.error(`Failed to kill PTY process: ${e.message}`);
      }
      this.shells.delete(socketId);
    }
  }

  // --- AGENT CHAT EVENTS ---

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; sessionId: string; agent: string; message: string },
  ) {
    const { projectId, sessionId, agent, message } = data;

    try {
      const project = await this.projectsService.getProject(projectId);

      // Save user message to DB
      await this.prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
        },
      });

      // Prepare Agent command
      let cmd = '';
      let args: string[] = [];

      if (agent === 'hermes') {
        cmd = 'C:\\Users\\ROS RENDO\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe';
        // Use oneshot mode, pointing inside the project workspace
        args = ['-z', message, '--in', project.path, '--continue', sessionId];
      } else if (agent === 'opencode') {
        cmd = 'C:\\Program Files\\nodejs\opencode.cmd';
        args = ['run', message, '--project', project.path, '--session', sessionId];
      } else {
        throw new Error(`Unsupported agent type: ${agent}`);
      }

      console.log(`Launching agent ${agent} with command: ${cmd} ${args.join(' ')}`);

      client.emit('chat:status', { status: 'thinking' });

      // Spawn the agent process
      const agentProcess = spawnProcess(cmd, args, {
        cwd: project.path,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'UTF-8',
        },
      });

      let responseText = '';

      agentProcess.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf-8');
        responseText += text;
        client.emit('chat:output', { text });
      });

      agentProcess.stderr.on('data', (chunk: Buffer) => {
        // Stream stderr logs as progress / system logs
        const logText = chunk.toString('utf-8');
        client.emit('chat:log', { log: logText });
      });

      agentProcess.on('close', async (code: number) => {
        console.log(`Agent ${agent} process closed with code ${code}`);
        
        if (code === 0 || responseText.trim().length > 0) {
          // Save assistant message to DB
          const savedMsg = await this.prisma.message.create({
            data: {
              sessionId,
              role: 'assistant',
              content: responseText,
            },
          });

          client.emit('chat:done', { message: savedMsg });
        } else {
          client.emit('chat:error', { error: `Agent process failed with exit code ${code}` });
        }
      });

      agentProcess.on('error', (err: Error) => {
        console.error(`Failed to start agent: ${err.message}`);
        client.emit('chat:error', { error: `Failed to spawn agent binary: ${err.message}` });
      });
    } catch (e) {
      client.emit('chat:error', { error: e.message });
    }
  }

  // --- FILE SYSTEM WATCHER EVENTS ---

  @SubscribeMessage('watch:init')
  async handleWatchInit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const { projectId } = data;
    this.cleanupWatcher(client.id);

    try {
      const project = await this.projectsService.getProject(projectId);
      console.log(`Initializing file watcher for project ${project.name} on ${project.path}`);

      const watcher = chokidar.watch(project.path, {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/*.db',
        ],
        persistent: true,
        ignoreInitial: true,
        depth: 3, // limit watch depth to avoid memory bloat
      });

      watcher.on('all', (event, filepath) => {
        const relPath = path.relative(project.path, filepath).replace(/\\/g, '/');
        client.emit('files:changed', { event, path: relPath });
      });

      this.watchers.set(client.id, { watcher, projectId });
    } catch (e) {
      console.error(`Watcher error: ${e.message}`);
    }
  }

  private cleanupWatcher(socketId: string) {
    const watcherInfo = this.watchers.get(socketId);
    if (watcherInfo) {
      console.log(`Closing file watcher for socket: ${socketId}`);
      watcherInfo.watcher.close();
      this.watchers.delete(socketId);
    }
  }
}
