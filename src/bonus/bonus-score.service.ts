import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateBonusScoreDto } from './dto/create-bonus-score.dto';
import { UpdateBonusScoreDto } from './dto/update-bonus-score.dto';

@Injectable()
export class BonusScoreService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBonusScoreDto) {
    return this.prisma.bonusScore.create({ data });
  }


  async findLatestByUser(userId: string) {
    return this.prisma.bonusScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

 async checkTodayScore(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const record = await this.prisma.bonusScore.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return { exists: !!record };
  }


}
