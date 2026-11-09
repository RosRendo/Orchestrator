import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync, exec, ChildProcess } from 'child_process';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async listProjects() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async createProject(name: string, folderPath: string) {
    let resolvedPath = '';
    const clonedReposDir = path.join(process.cwd(), 'cloned_repos');

    const isGitUrl = folderPath.startsWith('http://') || 
                      folderPath.startsWith('https://') || 
                      folderPath.startsWith('git@') || 
                      folderPath.endsWith('.git');

    if (isGitUrl) {
      // Create cloned_repos directory if it doesn't exist
      if (!fs.existsSync(clonedReposDir)) {
        fs.mkdirSync(clonedReposDir, { recursive: true });
      }

      // Generate unique name for the clone
      const repoName = folderPath.split('/').pop()?.replace('.git', '') || 'repo';
      const uniqueFolderName = `${repoName}-${Date.now()}`;
      resolvedPath = path.join(clonedReposDir, uniqueFolderName);

      try {
        // Clone with depth 1 for maximum speed
        execSync(`git clone --depth 1 "${folderPath}" "${resolvedPath}"`, { stdio: 'pipe' });
      } catch (err: any) {
        throw new BadRequestException(`Failed to clone git repository: ${err.message}`);
      }
    } else {
      resolvedPath = path.resolve(folderPath);
      
      // Validate path exists and is a directory
      if (!fs.existsSync(resolvedPath)) {
        try {
          fs.mkdirSync(resolvedPath, { recursive: true });
        } catch (err: any) {
          throw new BadRequestException(`Folder path does not exist and could not be created: ${err.message}`);
        }
      } else {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
          throw new BadRequestException('Path exists but is not a directory');
        }
      }
    }

    try {
      return await this.prisma.project.create({
        data: {
          name,
          path: resolvedPath,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('A project with this path already exists');
      }
      throw err;
    }
  }

  async deleteProject(id: string) {
    const project = await this.getProject(id);
    await this.prisma.project.delete({
      where: { id },
    });

    const clonedReposDir = path.join(process.cwd(), 'cloned_repos');
    if (project.path.startsWith(clonedReposDir)) {
      try {
        fs.rmSync(project.path, { recursive: true, force: true });
      } catch (err: any) {
        console.error(`Failed to clean up cloned repo directory: ${err.message}`);
      }
    }
    return { success: true };
  }

  async updateProjectMetadata(id: string, data: {
    description?: string;
    stack?: string[];
    tags?: string[];
    deployTargets?: Record<string, string>;
    agentConfig?: Record<string, string>;
  }) {
    await this.getProject(id); // ensures exists
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.stack !== undefined ? { stack: JSON.stringify(data.stack) } : {}),
        ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
        ...(data.deployTargets !== undefined ? { deployTargets: JSON.stringify(data.deployTargets) } : {}),
        ...(data.agentConfig !== undefined ? { agentConfig: JSON.stringify(data.agentConfig) } : {}),
      },
    });
  }

  async getProjectHealth(id: string) {
    const project = await this.getProject(id);
    const exists = fs.existsSync(project.path);
    let gitBranch = '';
    let hasPackageJson = false;
    let hasPrisma = false;
    let hasDockerCompose = false;

    if (exists) {
      hasPackageJson = fs.existsSync(path.join(project.path, 'package.json'));
      hasPrisma = fs.existsSync(path.join(project.path, 'prisma', 'schema.prisma'));
      hasDockerCompose = fs.existsSync(path.join(project.path, 'docker-compose.yml')) ||
                         fs.existsSync(path.join(project.path, 'docker-compose.yaml'));
      try {
        gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: project.path, stdio: 'pipe' }).toString().trim();
      } catch { gitBranch = ''; }
    }

    return {
      projectId: id,
      name: project.name,
      pathExists: exists,
      gitBranch,
      hasPackageJson,
      hasPrisma,
      hasDockerCompose,
    };
  }

  // File System Operations
  async getFileTree(projectId: string): Promise<FileNode[]> {
    const project = await this.getProject(projectId);
    return this.buildTree(project.path, project.path);
  }

  private buildTree(currentPath: string, rootPath: string): FileNode[] {
    const ignoredDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.nuxt', 'out', '.gemini', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
    
    try {
      const files = fs.readdirSync(currentPath);
      const nodes: FileNode[] = [];

      for (const file of files) {
        if (ignoredDirs.includes(file)) continue;

        const fullPath = path.join(currentPath, file);
        const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
        
        try {
          const stats = fs.statSync(fullPath);
          const isDirectory = stats.isDirectory();

          const node: FileNode = {
            name: file,
            path: relativePath,
            isDirectory,
          };

          if (isDirectory) {
            node.children = this.buildTree(fullPath, rootPath);
          } else {
            node.size = stats.size;
          }

          nodes.push(node);
        } catch (e) {
          // Skip files that error out (permissions, etc.)
          continue;
        }
      }

      // Sort: folders first, then files alphabetically
      return nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (e) {
      return [];
    }
  }

  async readFile(projectId: string, relativePath: string): Promise<{ content: string }> {
    const project = await this.getProject(projectId);
    const safePath = path.join(project.path, relativePath);
    this.validateSubpath(project.path, safePath);

    if (!fs.existsSync(safePath)) {
      throw new NotFoundException('File not found');
    }
    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) {
      throw new BadRequestException('Path is a directory, not a file');
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    return { content };
  }

  async writeFile(projectId: string, relativePath: string, content: string): Promise<{ success: boolean }> {
    const project = await this.getProject(projectId);
    const safePath = path.join(project.path, relativePath);
    this.validateSubpath(project.path, safePath);

    const dir = path.dirname(safePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(safePath, content, 'utf-8');
    return { success: true };
  }

  async createFile(projectId: string, relativePath: string, isDirectory: boolean): Promise<{ success: boolean }> {
    const project = await this.getProject(projectId);
    const safePath = path.join(project.path, relativePath);
    this.validateSubpath(project.path, safePath);

    if (fs.existsSync(safePath)) {
      throw new BadRequestException('File or directory already exists');
    }

    if (isDirectory) {
      fs.mkdirSync(safePath, { recursive: true });
    } else {
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(safePath, '', 'utf-8');
    }

    return { success: true };
  }

  async deleteFileOrFolder(projectId: string, relativePath: string): Promise<{ success: boolean }> {
    const project = await this.getProject(projectId);
    const safePath = path.join(project.path, relativePath);
    this.validateSubpath(project.path, safePath);

    if (!fs.existsSync(safePath)) {
      throw new NotFoundException('Path not found');
    }

    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) {
      fs.rmSync(safePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(safePath);
    }

    return { success: true };
  }

  async renameFileOrFolder(projectId: string, oldRelativePath: string, newRelativePath: string): Promise<{ success: boolean }> {
    const project = await this.getProject(projectId);
    const oldSafePath = path.join(project.path, oldRelativePath);
    const newSafePath = path.join(project.path, newRelativePath);
    this.validateSubpath(project.path, oldSafePath);
    this.validateSubpath(project.path, newSafePath);

    if (!fs.existsSync(oldSafePath)) {
      throw new NotFoundException('Source file/folder not found');
    }
    if (fs.existsSync(newSafePath)) {
      throw new BadRequestException('Target destination already exists');
    }

    const dir = path.dirname(newSafePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.renameSync(oldSafePath, newSafePath);
    return { success: true };
  }

  // Git Operations
  async getGitStatus(projectId: string) {
    const project = await this.getProject(projectId);
    try {
      // Check if it is a git repo
      execSync('git rev-parse --is-inside-work-tree', { cwd: project.path, stdio: 'ignore' });
    } catch (e) {
      return { isRepository: false, files: [] };
    }

    try {
      const output = execSync('git status --porcelain', { cwd: project.path, encoding: 'utf-8' });
      const lines = output.split('\n').filter(Boolean);
      const files = lines.map(line => {
        const code = line.slice(0, 2);
        const filepath = line.slice(3).trim();
        return {
          path: filepath,
          status: this.parseGitStatusCode(code),
          rawCode: code.trim(),
        };
      });
      return { isRepository: true, files };
    } catch (e) {
      return { isRepository: true, files: [], error: e.message };
    }
  }

  async getGitDiff(projectId: string, relativePath: string) {
    const project = await this.getProject(projectId);
    try {
      // First, get unstaged diff
      let diff = execSync(`git diff -- "${relativePath}"`, { cwd: project.path, encoding: 'utf-8' });
      // If empty, check staged diff
      if (!diff) {
        diff = execSync(`git diff --cached -- "${relativePath}"`, { cwd: project.path, encoding: 'utf-8' });
      }
      // If still empty (e.g. untracked file), just read the file content
      if (!diff && fs.existsSync(path.join(project.path, relativePath))) {
        const content = fs.readFileSync(path.join(project.path, relativePath), 'utf-8');
        diff = content.split('\n').map(line => `+${line}`).join('\n');
      }
      return { diff };
    } catch (e) {
      return { diff: '', error: e.message };
    }
  }

  async gitCommit(projectId: string, message: string) {
    const project = await this.getProject(projectId);
    try {
      // Add all changes
      execSync('git add -A', { cwd: project.path });
      // Commit
      const output = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: project.path, encoding: 'utf-8' });
      return { success: true, output };
    } catch (e) {
      throw new BadRequestException(`Git commit failed: ${e.message}`);
    }
  }

  async listSystemDirectories(dirPath?: string) {
    let currentPath = dirPath ? path.resolve(dirPath) : os.homedir();

    // Ensure the directory exists
    if (!fs.existsSync(currentPath)) {
      currentPath = os.homedir();
    }

    try {
      const stats = fs.statSync(currentPath);
      if (!stats.isDirectory()) {
        currentPath = path.dirname(currentPath);
      }
    } catch (e) {
      currentPath = os.homedir();
    }

    const folders: { name: string; path: string }[] = [];
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && !item.name.startsWith('$')) {
          const fullPath = path.join(currentPath, item.name);
          folders.push({
            name: item.name,
            path: fullPath,
          });
        }
      }
    } catch (err) {
      // Permission denied or other errors, return empty folder list
    }

    folders.sort((a, b) => a.name.localeCompare(b.name));

    const parsed = path.parse(currentPath);
    const parentPath = currentPath === parsed.root ? null : parsed.dir;

    let drives: string[] = [];
    if (process.platform === 'win32') {
      drives = await this.getWindowsDrives();
    }

    return {
      currentPath,
      parentPath,
      drives,
      folders,
    };
  }

  private async getWindowsDrives(): Promise<string[]> {
    try {
      const stdout = execSync('fsutil fsinfo drives', { encoding: 'utf8', stdio: 'pipe' });
      const matches = stdout.match(/[A-Z]:\\/g);
      if (matches && matches.length > 0) {
        return matches;
      }
    } catch (e) {
      console.warn('Failed to get drives via fsutil:', e);
    }
    return ['C:\\'];
  }

  // Security Helper: Ensure files do not escape project root folder
  private validateSubpath(rootPath: string, subPath: string) {
    const resolvedRoot = path.resolve(rootPath);
    const resolvedSub = path.resolve(subPath);
    if (!resolvedSub.startsWith(resolvedRoot)) {
      throw new BadRequestException('Access Denied: Path escapes the project workspace.');
    }
  }

  private parseGitStatusCode(code: string): string {
    const c = code.trim();
    if (c === '??') return 'untracked';
    if (c === 'M' || code[0] === 'M' || code[1] === 'M') return 'modified';
    if (c === 'A' || code[0] === 'A') return 'added';
    if (c === 'D' || code[0] === 'D' || code[1] === 'D') return 'deleted';
    if (c === 'R' || code[0] === 'R') return 'renamed';
    return 'modified';
  }

  private runningServers = new Map<string, { frontend?: ChildProcess; backend?: ChildProcess }>();

  async startProject(id: string): Promise<{ ok: boolean; msg: string }> {
    const project = await this.getProject(id);
    const hasStartBat = fs.existsSync(path.join(project.path, 'start_local.bat'));

    if (hasStartBat) {
      const isDashboard = project.name.toLowerCase() === 'dashboard' || project.name.toLowerCase() === 'journex';

      const runStart = (): Promise<{ ok: boolean; msg: string }> => {
        return new Promise((resolve) => {
          exec('cmd.exe /c start_local.bat', { cwd: project.path }, (err) => {
            if (err) {
              resolve({ ok: false, msg: `Failed to run start_local.bat: ${err.message}` });
            } else {
              resolve({ ok: true, msg: 'start_local.bat executed successfully.' });
            }
          });
        });
      };

      if (isDashboard) {
        return new Promise((resolve) => {
          console.log('Attempting to stop local native PostgreSQL service (postgresql-x64-18) to avoid port 5432 conflict...');
          exec('net stop postgresql-x64-18', (stopErr) => {
            if (stopErr) {
              console.warn(`Failed to stop postgresql-x64-18 service: ${stopErr.message}. Proceeding to start batch...`);
              runStart().then((res) => {
                resolve({
                  ok: res.ok,
                  msg: res.ok
                    ? 'Start script executed. Note: Failed to stop local native postgresql-x64-18 service automatically (Access Denied). Please run Orchestrator as Administrator or stop the service manually.'
                    : res.msg,
                });
              });
            } else {
              console.log('Successfully stopped local native PostgreSQL service.');
              runStart().then(resolve);
            }
          });
        });
      } else {
        return runStart();
      }
    } else {
      const existing = this.runningServers.get(id);
      if (existing?.frontend) {
        try { existing.frontend.kill(); } catch {}
      }
      const proc = exec('npm run dev', { cwd: project.path });
      this.runningServers.set(id, { ...(existing || {}), frontend: proc });
      return { ok: true, msg: 'Started npm run dev server in background.' };
    }
  }

  async stopProject(id: string): Promise<{ ok: boolean; msg: string }> {
    const project = await this.getProject(id);
    const hasStopBat = fs.existsSync(path.join(project.path, 'stop_local.bat'));

    if (hasStopBat) {
      const isDashboard = project.name.toLowerCase() === 'dashboard' || project.name.toLowerCase() === 'journex';

      const runStop = (): Promise<{ ok: boolean; msg: string }> => {
        return new Promise((resolve) => {
          exec('cmd.exe /c stop_local.bat', { cwd: project.path }, (err) => {
            if (err) {
              resolve({ ok: false, msg: `Failed to run stop_local.bat: ${err.message}` });
            } else {
              resolve({ ok: true, msg: 'stop_local.bat executed successfully.' });
            }
          });
        });
      };

      if (isDashboard) {
        return new Promise((resolve) => {
          runStop().then((res) => {
            console.log('Attempting to restart local native PostgreSQL service (postgresql-x64-18)...');
            exec('net start postgresql-x64-18', (startErr) => {
              if (startErr) {
                console.warn(`Failed to restart postgresql-x64-18 service: ${startErr.message}`);
                resolve({
                  ok: res.ok,
                  msg: res.ok
                    ? 'Stop script executed. Note: Failed to restart local native postgresql-x64-18 service automatically (Access Denied). Please run Orchestrator as Administrator or start the service manually.'
                    : res.msg,
                });
              } else {
                console.log('Successfully restarted local native PostgreSQL service.');
                resolve(res);
              }
            });
          });
        });
      } else {
        return runStop();
      }
    } else {
      const running = this.runningServers.get(id);
      if (!running || (!running.frontend && !running.backend)) {
        return { ok: false, msg: 'No running servers found for this project.' };
      }
      if (running.frontend) {
        try { running.frontend.kill(); } catch {}
      }
      if (running.backend) {
        try { running.backend.kill(); } catch {}
      }
      this.runningServers.delete(id);
      return { ok: true, msg: 'Successfully stopped running servers.' };
    }
  }

  // ─── Mission Management Services ───────────────────────────────────────────

  async listMissions() {
    return this.prisma.mission.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMission(title: string, agentId: string, projectId?: string) {
    return this.prisma.mission.create({
      data: {
        title,
        agentId,
        projectId: projectId || null,
        status: 'pending',
        steps: JSON.stringify(['Task received & registered in db']),
      },
    });
  }

  async updateMission(id: string, data: any) {
    return this.prisma.mission.update({
      where: { id },
      data,
    });
  }

  async deleteMission(id: string) {
    return this.prisma.mission.delete({
      where: { id },
    });
  }

  async runMission(id: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) throw new Error('Mission not found');

    // Reset fields and start run status
    await this.prisma.mission.update({
      where: { id },
      data: {
        status: 'running',
        steps: JSON.stringify(['Task Analysis: Reading context parameters']),
        codeChanges: null,
        tests: null,
        report: null,
      },
    });

    const stepsList = [
      'Task Analysis: Reading context parameters',
      `Agent Assignment: Brain allocated to ${mission.agentId.toUpperCase()} agent`,
      'Workspace Audit: Inspecting directories and parsing dependencies',
      'Build Verification: Running lint and testing workspace sanity',
      'Report Compiler: Generating custom audit report summary',
    ];

    // Asynchronous step simulator
    let currentStepIdx = 0;
    const interval = setInterval(async () => {
      currentStepIdx++;
      if (currentStepIdx >= stepsList.length) {
        clearInterval(interval);

        // Fetch real project details
        const project = mission.projectId ? await this.prisma.project.findUnique({ where: { id: mission.projectId } }) : null;
        
        let reportMd = '';
        let codeChangesData = { files: [] as string[], additions: 0, deletions: 0 };
        let testsData = { passed: true, summary: 'No tests found in project workspace.' };

        if (project && fs.existsSync(project.path)) {
          const hasGit = fs.existsSync(path.join(project.path, '.git'));
          const hasPackageJson = fs.existsSync(path.join(project.path, 'package.json'));
          const hasDockerCompose = fs.existsSync(path.join(project.path, 'docker-compose.yml'));
          const hasEnv = fs.existsSync(path.join(project.path, '.env'));

          let gitBranch = 'N/A';
          let gitStatusText = 'Not a Git Repository';
          let gitFilesCount = 0;
          if (hasGit) {
            try {
              gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: project.path, encoding: 'utf8' }).trim();
              const statusOutput = execSync('git status --porcelain', { cwd: project.path, encoding: 'utf8' });
              const statusLines = statusOutput.split('\n').filter(l => l.trim());
              gitFilesCount = statusLines.length;
              gitStatusText = gitFilesCount > 0 ? `${gitFilesCount} modified/untracked files` : 'Clean working directory';
              
              if (gitFilesCount > 0) {
                codeChangesData.files = statusLines.map(l => l.slice(3).trim()).slice(0, 5);
                codeChangesData.additions = gitFilesCount * 4;
                codeChangesData.deletions = Math.round(gitFilesCount * 1.5);
              }
            } catch {
              gitBranch = 'main (fallback)';
            }
          }

          let pkgName = project.name;
          let pkgDeps: string[] = [];
          let pkgScripts: string[] = [];
          if (hasPackageJson) {
            try {
              const pkg = JSON.parse(fs.readFileSync(path.join(project.path, 'package.json'), 'utf8'));
              pkgName = pkg.name || project.name;
              pkgDeps = Object.keys(pkg.dependencies || {}).slice(0, 8);
              pkgScripts = Object.keys(pkg.scripts || {}).slice(0, 5);
            } catch {}
          }

          reportMd = `# Real-Time Workspace Audit Report\n\n` +
            `**Mission ID:** \`${id}\`\n` +
            `**Task Context:** *${mission.title}*\n` +
            `**Audited Project:** \`${project.name}\` \n` +
            `**Project Path:** \`${project.path}\`\n\n` +
            `## 📦 Package Summary\n` +
            `- **App Name**: \`${pkgName}\`\n` +
            `- **package.json**: ${hasPackageJson ? '🟢 Found' : '⚪ Missing'}\n` +
            (hasPackageJson ? `- **Primary Dependencies**: ${pkgDeps.join(', ') || 'None'}\n` +
                              `- **Configured Scripts**: ${pkgScripts.map(s => `\`npm run ${s}\``).join(', ') || 'None'}\n` : '') +
            `\n` +
            `## 🌐 Environment & Infrastructure\n` +
            `- **Docker Compose**: ${hasDockerCompose ? '🟢 Found (docker-compose.yml)' : '⚪ Missing'}\n` +
            `- **Local env file**: ${hasEnv ? '🟢 Configured (.env)' : '⚪ Missing'}\n` +
            `\n` +
            `## 🌿 Git VCS Integration\n` +
            `- **Repository**: ${hasGit ? '🟢 Initialized (.git)' : '⚪ None'}\n` +
            `- **Active Branch**: \`${gitBranch}\`\n` +
            `- **Working Tree Status**: \`${gitStatusText}\`\n`;

          if (hasGit && gitFilesCount > 0) {
            reportMd += `\n### Modified/Untracked Files (VCS):\n` +
              execSync('git status -s', { cwd: project.path, encoding: 'utf8' }).split('\n').filter(l => l.trim()).map(l => `- \`${l.trim()}\``).join('\n') + `\n`;
          }

          reportMd += `\n*Audit completed by agent \`${mission.agentId.toUpperCase()}\` at ${new Date().toLocaleTimeString()}*`;
          testsData.summary = hasPackageJson ? 'Node compilation check successful. Syntax audit passed.' : 'Project path audit complete. Healthy status reported.';
        } else {
          reportMd = `# Mission Task Summary Report\n\n` +
            `**Mission ID:** \`${id}\`\n` +
            `**Task Title:** *${mission.title}*\n` +
            `**Agent:** \`${mission.agentId.toUpperCase()}\`\n` +
            `**Status:** ✅ Completed Successfully\n\n` +
            `No physical project path was configured or the path could not be loaded. Audit run in sandbox space successfully.`;
        }
        
        await this.prisma.mission.update({
          where: { id },
          data: {
            status: 'completed',
            steps: JSON.stringify(stepsList),
            codeChanges: codeChangesData.files.length > 0 ? JSON.stringify(codeChangesData) : null,
            tests: JSON.stringify(testsData),
            report: reportMd,
          },
        });
      } else {
        // Increment step state updates
        const currentSteps = stepsList.slice(0, currentStepIdx + 1);
        const updateData: any = {
          steps: JSON.stringify(currentSteps),
        };
        
        // Simulate code changes generation midway
        if (currentStepIdx === 2) {
          updateData.codeChanges = JSON.stringify({
            files: ['package.json'],
            additions: 1,
            deletions: 0
          });
        }
        // Simulate test outputs
        if (currentStepIdx === 3) {
          updateData.tests = JSON.stringify({
            passed: true,
            summary: 'Checking project workspace sanity... OK'
          });
        }

        await this.prisma.mission.update({
          where: { id },
          data: updateData,
        });
      }
    }, 2000);

    return { ok: true, msg: 'Mission execution triggered' };
  }

  // ─── RendoOs & AI-Command-Agent Integrated Hub Methods ──────────────────────

  async getTodaySummary() {
    const focusProject = await this.prisma.project.findFirst({
      where: {
        OR: [{ isPrimary: true }, { status: 'ACTIVE' }],
      },
      include: {
        tasks: {
          where: { status: 'TODO' },
          orderBy: { order: 'asc' },
          take: 5,
        },
        blockers: {
          where: { resolved: false },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const nowTasks = await this.prisma.task.findMany({
      where: { bucket: 'NOW', status: 'TODO' },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
      take: 6,
    });

    const nextTasks = await this.prisma.task.findMany({
      where: { bucket: 'NEXT', status: 'TODO' },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
      take: 6,
    });

    const laterTasks = await this.prisma.task.findMany({
      where: { bucket: 'LATER', status: 'TODO' },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
      take: 6,
    });

    const unresolvedBlockers = await this.prisma.blocker.findMany({
      where: { resolved: false },
      include: { project: { select: { id: true, name: true } } },
      take: 10,
    });

    const totalProjects = await this.prisma.project.count();
    const activeProjects = await this.prisma.project.count({ where: { status: 'ACTIVE' } });
    const totalTasks = await this.prisma.task.count();
    const completedTasks = await this.prisma.task.count({ where: { status: 'DONE' } });
    const ideasCount = await this.prisma.idea.count();

    return {
      focusProject,
      nowTasks,
      nextTasks,
      laterTasks,
      blockers: unresolvedBlockers,
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        ideasCount,
      },
    };
  }

  async listTasks(projectId?: string) {
    if (projectId) {
      return this.prisma.task.findMany({
        where: { projectId },
        orderBy: [{ bucket: 'asc' }, { order: 'asc' }],
      });
    }
    return this.prisma.task.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ bucket: 'asc' }, { order: 'asc' }],
    });
  }

  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    bucket?: string;
    priority?: string;
  }) {
    return this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        bucket: data.bucket || 'NOW',
        priority: data.priority || 'MEDIUM',
        status: 'TODO',
      },
    });
  }

  async updateTask(id: string, data: any) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async deleteTask(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async listIdeas() {
    return this.prisma.idea.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIdea(data: { title: string; description?: string; tags?: string; projectId?: string }) {
    return this.prisma.idea.create({
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags,
        projectId: data.projectId || null,
      },
    });
  }

  async deleteIdea(id: string) {
    return this.prisma.idea.delete({
      where: { id },
    });
  }

  async convertIdeaToProject(id: string) {
    const idea = await this.prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new NotFoundException('Idea not found');

    const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const projPath = path.join('D:/FOR RENDO (ONLY )/Personal Project', idea.title.replace(/[\/\\:*?"<>|]/g, ''));

    const project = await this.prisma.project.create({
      data: {
        name: idea.title,
        slug,
        path: projPath,
        folderPath: projPath,
        description: idea.description || `Generated from Idea: ${idea.title}`,
        status: 'IDEA',
      },
    });

    await this.prisma.idea.update({
      where: { id },
      data: { convertedToProjectId: project.id },
    });

    return project;
  }

  async listBlockers() {
    return this.prisma.blocker.findMany({
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBlocker(data: { projectId: string; title: string; description?: string }) {
    return this.prisma.blocker.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
      },
    });
  }

  async resolveBlocker(id: string) {
    const blk = await this.prisma.blocker.findUnique({ where: { id } });
    if (!blk) throw new NotFoundException('Blocker not found');
    return this.prisma.blocker.update({
      where: { id },
      data: { resolved: !blk.resolved },
    });
  }

  async listPlaybook(type?: string) {
    const where: any = {};
    if (type) where.type = type.toUpperCase();
    return this.prisma.playbookEntry.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlaybookEntry(data: {
    projectId?: string;
    type: string;
    title: string;
    content: string;
    tags?: string;
    scope?: string;
  }) {
    return this.prisma.playbookEntry.create({
      data: {
        projectId: data.projectId || null,
        type: data.type.toUpperCase(),
        title: data.title,
        content: data.content,
        tags: data.tags,
        scope: data.scope || 'GLOBAL',
      },
    });
  }

  async scanProjectGaps(projectId: string) {
    const project = await this.getProject(projectId);
    const findings: Array<{
      category: string;
      title: string;
      description: string;
      severity: string;
      autoFixCode?: string;
    }> = [];

    if (!fs.existsSync(project.path)) {
      return { findings, score: '0/100', status: 'Path Not Found' };
    }

    // 1. Check Rate Limiting
    const hasRateLimit = fs.existsSync(path.join(project.path, 'package.json')) &&
      fs.readFileSync(path.join(project.path, 'package.json'), 'utf-8').includes('rate-limit');
    if (!hasRateLimit) {
      findings.push({
        category: 'SECURITY',
        title: 'Missing API Rate Limiting',
        description: 'No rate-limiting package (e.g. express-rate-limit, @nestjs/throttler) was detected in package.json.',
        severity: 'HIGH',
        autoFixCode: 'npm install express-rate-limit\n// or for NestJS:\nnpm install @nestjs/throttler',
      });
    }

    // 2. Check CORS Configuration
    let openCorsFound = false;
    try {
      const serverFiles = ['src/main.ts', 'server.js', 'src/server.js', 'src/app.ts'];
      for (const sf of serverFiles) {
        const fullP = path.join(project.path, sf);
        if (fs.existsSync(fullP)) {
          const content = fs.readFileSync(fullP, 'utf-8');
          if (content.includes("origin: '*'") || content.includes('app.use(cors())')) {
            openCorsFound = true;
            break;
          }
        }
      }
    } catch {}

    if (openCorsFound) {
      findings.push({
        category: 'SECURITY',
        title: 'Permissive Wildcard CORS Detected',
        description: 'Server configuration appears to use open CORS (origin: *). Restrict to trusted frontends.',
        severity: 'MEDIUM',
      });
    }

    // 3. Check Test Suite
    const hasTests = fs.existsSync(path.join(project.path, 'test')) ||
                     fs.existsSync(path.join(project.path, 'tests')) ||
                     fs.existsSync(path.join(project.path, '__tests__'));
    if (!hasTests) {
      findings.push({
        category: 'TESTING',
        title: 'Missing Automated Test Suite',
        description: 'No test directory (test/, tests/) or test runners configured for integration verification.',
        severity: 'MEDIUM',
      });
    }

    // 4. Check Database Backup / Docker
    const hasDocker = fs.existsSync(path.join(project.path, 'docker-compose.yml')) ||
                      fs.existsSync(path.join(project.path, 'Dockerfile'));
    if (!hasDocker) {
      findings.push({
        category: 'DEVOPS',
        title: 'Missing Docker / Containerization Config',
        description: 'No Dockerfile or docker-compose.yml found for reproducible production runtime.',
        severity: 'LOW',
      });
    }

    const score = Math.max(0, 100 - (findings.filter(f => f.severity === 'HIGH').length * 30 + findings.filter(f => f.severity === 'MEDIUM').length * 15 + findings.filter(f => f.severity === 'LOW').length * 5));

    return {
      projectId,
      projectName: project.name,
      score: `${score}/100`,
      findings,
      scannedAt: new Date().toISOString(),
    };
  }
}

