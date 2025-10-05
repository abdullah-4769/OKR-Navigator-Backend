// src/challenge-mode-score/challenge-mode-score.module.ts
import { Module } from '@nestjs/common'
import { ChallengeModeScoreService } from './challenge-mode-score.service'
import { ChallengeModeScoreController } from './challenge-mode-score.controller'
import { PrismaService } from '../../lib/prisma/prisma.service'

@Module({
  controllers: [ChallengeModeScoreController],
  providers: [ChallengeModeScoreService, PrismaService],
})
export class ChallengeModeScoreModule {}
