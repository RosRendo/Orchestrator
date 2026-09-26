import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  async listSessions(@Query('projectId') projectId: string) {
    return this.sessionsService.listSessions(projectId);
  }

  @Post()
  async createSession(
    @Body() body: { projectId: string; agentType: string; name: string },
  ) {
    return this.sessionsService.createSession(body.projectId, body.agentType, body.name);
  }

  @Get(':id/messages')
  async getSessionMessages(@Param('id') id: string) {
    return this.sessionsService.getSessionMessages(id);
  }

  @Delete(':id')
  async deleteSession(@Param('id') id: string) {
    return this.sessionsService.deleteSession(id);
  }
}
