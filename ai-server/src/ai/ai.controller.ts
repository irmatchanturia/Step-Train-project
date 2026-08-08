import { Body, Controller, Get, Post } from '@nestjs/common';

import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto/chat-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() body: ChatRequestDto) {
    return this.aiService.chat(body.message, body.history ?? []);
  }

  @Get('stations')
  getStations() {
    return this.aiService.getStations();
  }
}
