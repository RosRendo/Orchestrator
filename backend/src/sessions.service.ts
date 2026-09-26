import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async listSessions(projectId: string) {
    return this.prisma.session.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSession(projectId: string, agentType: string, name: string) {
    return this.prisma.session.create({
      data: {
        projectId,
        agentType,
        name,
      },
    });
  }

  async getSessionMessages(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteSession(sessionId: string) {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
    return { success: true };
  }
}
