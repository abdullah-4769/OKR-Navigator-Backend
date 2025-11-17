import { Module } from '@nestjs/common';
import { BonusScoreService } from './bonus-score.service';
import { BonusScoreController } from './bonus-score.controller';
import { PrismaService } from '../lib/prisma/prisma.service';

@Module({
  controllers: [BonusScoreController],
  providers: [BonusScoreService, PrismaService],
})
export class BonusScoreModule {}
