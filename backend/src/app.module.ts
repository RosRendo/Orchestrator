import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { WorkspaceGateway } from './workspace.gateway';
import { AutomationController } from './automation.controller';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [],
  controllers: [AppController, ProjectsController, SessionsController, AutomationController, TelegramController],
  providers: [AppService, PrismaService, ProjectsService, SessionsService, WorkspaceGateway, TelegramService],
})
export class AppModule {}
