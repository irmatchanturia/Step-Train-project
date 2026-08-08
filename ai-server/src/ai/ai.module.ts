import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeService } from '../ai/services/claude/claude.service';
import { StepApiService } from '../ai/services/step-api/step-api.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ClaudeService, StepApiService],
})
export class AiModule {}
