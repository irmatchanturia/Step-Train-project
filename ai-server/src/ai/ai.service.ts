import { Injectable } from '@nestjs/common';

import { ChatMessageDto } from '../ai/dto/chat-request.dto/chat-request.dto';
import { AiChatResult, ClaudeService } from './services/claude/claude.service';
import { Station, StepApiService } from './services/step-api/step-api.service';

@Injectable()
export class AiService {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly stepApiService: StepApiService,
  ) {}

  async chat(
    message: string,
    history: ChatMessageDto[] = [],
  ): Promise<AiChatResult> {
    return this.claudeService.sendMessage(message, history);
  }

  async getStations(): Promise<Station[]> {
    return this.stepApiService.getStations();
  }
}
