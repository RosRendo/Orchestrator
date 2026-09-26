import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectsService, FileNode } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // ─── Mission Management Endpoints ──────────────────────────────────────────

  @Get('missions/all')
  async listMissions() {
    return this.projectsService.listMissions();
  }

  @Post('missions/create')
  async createMission(
    @Body() body: { title: string; agentId: string; projectId?: string },
  ) {
    return this.projectsService.createMission(body.title, body.agentId, body.projectId);
  }

  @Patch('missions/:id')
  async updateMission(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.updateMission(id, body);
  }

  @Delete('missions/:id')
  async deleteMission(@Param('id') id: string) {
    return this.projectsService.deleteMission(id);
  }

  @Post('missions/:id/run')
  async runMission(@Param('id') id: string) {
    return this.projectsService.runMission(id);
  }

  @Get()
  async listProjects() {
    return this.projectsService.listProjects();
  }

  @Post()
  async createProject(@Body() body: { name: string; path: string }) {
    return this.projectsService.createProject(body.name, body.path);
  }

  @Get('system-dirs')
  async listSystemDirectories(@Query('path') path?: string) {
    return this.projectsService.listSystemDirectories(path);
  }

  @Get(':id')
  async getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }

  // Update project metadata (intelligence fields)
  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() body: {
      description?: string;
      stack?: string[];
      tags?: string[];
      deployTargets?: Record<string, string>;
      agentConfig?: Record<string, string>;
    },
  ) {
    return this.projectsService.updateProjectMetadata(id, body);
  }

  // Project health check
  @Get(':id/health')
  async getProjectHealth(@Param('id') id: string) {
    return this.projectsService.getProjectHealth(id);
  }

  // File tree
  @Get(':id/files')
  async getFileTree(@Param('id') id: string): Promise<FileNode[]> {
    return this.projectsService.getFileTree(id);
  }

  // Read file
  @Get(':id/files/read')
  async readFile(@Param('id') id: string, @Query('path') filepath: string) {
    return this.projectsService.readFile(id, filepath);
  }

  // Write file
  @Post(':id/files/write')
  async writeFile(
    @Param('id') id: string,
    @Body() body: { path: string; content: string },
  ) {
    return this.projectsService.writeFile(id, body.path, body.content);
  }

  // Create file or folder
  @Post(':id/files/create')
  async createFile(
    @Param('id') id: string,
    @Body() body: { path: string; isDirectory: boolean },
  ) {
    return this.projectsService.createFile(id, body.path, body.isDirectory);
  }

  // Delete file or folder
  @Delete(':id/files')
  async deleteFileOrFolder(
    @Param('id') id: string,
    @Query('path') filepath: string,
  ) {
    return this.projectsService.deleteFileOrFolder(id, filepath);
  }

  // Rename file or folder
  @Post(':id/files/rename')
  async renameFileOrFolder(
    @Param('id') id: string,
    @Body() body: { oldPath: string; newPath: string },
  ) {
    return this.projectsService.renameFileOrFolder(id, body.oldPath, body.newPath);
  }

  // Git endpoints
  @Get(':id/git/status')
  async getGitStatus(@Param('id') id: string) {
    return this.projectsService.getGitStatus(id);
  }

  @Get(':id/git/diff')
  async getGitDiff(@Param('id') id: string, @Query('path') filepath: string) {
    return this.projectsService.getGitDiff(id, filepath);
  }

  @Post(':id/git/commit')
  async gitCommit(@Param('id') id: string, @Body() body: { message: string }) {
    return this.projectsService.gitCommit(id, body.message);
  }

  @Post(':id/start')
  async startProject(@Param('id') id: string) {
    return this.projectsService.startProject(id);
  }

  @Post(':id/stop')
  async stopProject(@Param('id') id: string) {
    return this.projectsService.stopProject(id);
  }
}
