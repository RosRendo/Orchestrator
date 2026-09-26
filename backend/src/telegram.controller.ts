import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, '.agents', 'telegram_config.json');

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('status')
  getStatus(@Res() res: any) {
    res.json(this.telegramService.getStatus());
  }

  @Post('config')
  updateConfig(
    @Body() body: { token: string; allowedChatId: string; active: boolean },
    @Res() res: any
  ) {
    this.telegramService.updateConfig(body.token, body.allowedChatId, body.active);
    res.json({ ok: true });
  }

  @Post('toggle')
  toggleBot(@Body() body: { active: boolean }, @Res() res: any) {
    let token = '';
    let allowedChatId = '';
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        token = config.token || '';
        allowedChatId = config.allowedChatId || '';
      }
    } catch {}

    this.telegramService.updateConfig(token, allowedChatId, body.active);
    res.json({ ok: true });
  }
}
