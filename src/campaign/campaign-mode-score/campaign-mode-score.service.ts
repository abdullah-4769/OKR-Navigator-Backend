// campaign-mode-score.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreateCampaignModeScoreDto } from './dto/create-campaign-mode-score.dto';

@Injectable()
export class CampaignModeScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCampaignModeScoreDto) {
    return this.prisma.campaignModeScore.create({ data });
  }

  async findAll() {
    return this.prisma.campaignModeScore.findMany();
  }

  // userId is string now
  async findByUserId(userId: string) {
    return this.prisma.campaignModeScore.findMany({ where: { userId } });
  }

  async findLatestByUser(userId: string) {
    return this.prisma.campaignModeScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

async getUserCampaignRanking(userId: string) {
  const usersScores = await this.prisma.campaignModeScore.groupBy({
    by: ['userId'],
    _sum: { totalScore: true },
    _count: { id: true },
    orderBy: { _sum: { totalScore: 'desc' } },
  });

  if (!usersScores.length) return null;

  const userIds = usersScores
    .map(u => u.userId)
    .filter((id): id is string => id !== null);

  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarPicId: true },
  });

  const pointAdjustments = await this.prisma.pointAdjustment.findMany({
    orderBy: { xpRangeStart: 'asc' },
  });

  const getLevelDataFromXP = (xp: number) => {
    const pa = pointAdjustments.slice().reverse().find(p => xp >= p.xpRangeStart);
    if (!pa) return { levelNumber: 1, levelTitle: 'Newcomer' };
    return { levelNumber: pa.level, levelTitle: pa.title };
  };

  const ranked = usersScores
    .map(s => {
      if (!s.userId) return null;

      const user = users.find(u => u.id === s.userId);
      const totalScore = s._sum.totalScore || 0;
      const levelData = getLevelDataFromXP(totalScore);

      return {
        userId: s.userId,
        name: user?.name || 'Unknown',
        avatarPicId: user?.avatarPicId || null,
        totalScore,
        level: levelData.levelTitle,
        rank: levelData.levelNumber,
      };
    })
    .filter(Boolean) as {
      userId: string;
      name: string;
      avatarPicId: string | null;
      totalScore: number;
      level: string;
      rank: number;
    }[];

  ranked.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return b.totalScore - a.totalScore;
  });

  const userDetails = ranked.find(u => u.userId === userId) || null;

  return {
    message: 'User campaign ranking fetched successfully',
    topThree: ranked.slice(0, 3),
    remaining: ranked.slice(3),
    userDetails,
  };
}


  
}

