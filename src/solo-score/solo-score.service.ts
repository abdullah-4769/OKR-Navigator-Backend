import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';

export class CreateSoloScoreDto {
  userId: string;
  score: number;     
  scor?: string;       
  alignmentStrategy: number;
  objectiveClarity: number;
  keyResultQuality: number;
  initiativeRelevance: number;
  challengeAdoption: number;
}

@Injectable()
export class SoloScoreService {
  constructor(private readonly prisma: PrismaService) {}

  private assignRewards(score: number) {
    let badge = '';
    let trophy = '';

    if (score === 100) {
      badge = 'Platinum Star';
      trophy = 'Gold Trophy';
    } else if (score >= 90) {
      badge = 'Gold Star';
      trophy = 'Silver Trophy';
    } else if (score >= 80) {
      badge = 'Silver Star';
    } else if (score >= 70) {
      badge = 'Bronze Star';
    } else {
      badge = 'Participant';
    }

    return { badge, trophy };
  }

  async create(data: CreateSoloScoreDto) {
    const { badge, trophy } = this.assignRewards(data.score);
    return this.prisma.soloScore.create({
      data: { ...data, badge, trophy },
    });
  }

  async findAll() {
    return this.prisma.soloScore.findMany();
  }

  async findOne(id: number) {
    return this.prisma.soloScore.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<CreateSoloScoreDto>) {
    let badge: string | undefined;
    let trophy: string | undefined;

    if (data.score !== undefined) {
      const rewards = this.assignRewards(data.score);
      badge = rewards.badge;
      trophy = rewards.trophy;
    }

    return this.prisma.soloScore.update({
      where: { id },
      data: { ...data, ...(badge ? { badge } : {}), ...(trophy ? { trophy } : {}) },
    });
  }

  async remove(id: number) {
    return this.prisma.soloScore.delete({ where: { id } });
  }

  async findByUser(userId: string) {
    const records = await this.prisma.soloScore.findMany({ where: { userId } });
    return records.map(r => {
      const breakdown = {
        'alignment-strategy': `${Math.min(Math.round((r.alignmentStrategy / 40) * 2), 2)}/2`,
        'objective-clarity': `${Math.min(Math.round((r.objectiveClarity / 30) * 2), 2)}/2`,
        'keyresult-quality': `${Math.min(Math.round((r.keyResultQuality / 20) * 2), 2)}/2`,
        'initiative-relevance': `${Math.min(Math.round((r.initiativeRelevance / 10) * 2), 2)}/2`,
        'challenge-adoption': `${Math.min(Math.round((r.challengeAdoption / 10) * 2), 2)}/2`,
      };
      const { badge, trophy } = this.assignRewards(r.score);
      return { ...r, breakdown, badge, trophy };
    });
  }

  async findLatestByUser(userId: string) {
    const record = await this.prisma.soloScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;

    const breakdown = {
      'alignment-strategy': Math.min(Math.round((record.alignmentStrategy / 40) * 2), 2),
      'objective-clarity': Math.min(Math.round((record.objectiveClarity / 30) * 2), 2),
      'keyresult-quality': Math.min(Math.round((record.keyResultQuality / 20) * 2), 2),
      'initiative-relevance': Math.min(Math.round((record.initiativeRelevance / 10) * 2), 2),
      'challenge-adoption': Math.min(Math.round((record.challengeAdoption / 10) * 2), 2),
    };

    const totalPoints = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const { badge, trophy } = this.assignRewards(record.score);

    return {
      id: record.id,
      userId: record.userId,
      score: record.score,
      scor: record.scor,
      breakdown: {
        'alignment-strategy': `${breakdown['alignment-strategy']}/2`,
        'objective-clarity': `${breakdown['objective-clarity']}/2`,
        'keyresult-quality': `${breakdown['keyresult-quality']}/2`,
        'initiative-relevance': `${breakdown['initiative-relevance']}/2`,
        'challenge-adoption': `${breakdown['challenge-adoption']}/2`,
      },
      totalPoints: `${totalPoints}/10`,
      badge,
      trophy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

async getUserRewardsSummary(userId: string) {
  const latestRecords = await this.prisma.soloScore.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  if (!latestRecords.length) return null;

  const trophiesCount = latestRecords.filter(r => r.trophy).length;
  const badgesCount = latestRecords.filter(r => r.badge).length;
  const scorList = latestRecords.map(r => r.scor);

  const sumAchieved = latestRecords.reduce((sum, r) => sum + r.score, 0);
  const sumMax = latestRecords.length * 100;
  const successRate = Math.round((sumAchieved / sumMax) * 100);

  // Fetch all records for the user
  const allRecords = await this.prisma.soloScore.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return { 
    userId, 
    totalRecords: allRecords.length, 
    rewards: { trophies: trophiesCount, badges: badgesCount, scor: scorList }, 
    successRate,
    allRecords
  };
}


async getUserRanking(userId: string) {
  const usersScores = await this.prisma.soloScore.groupBy({
    by: ['userId'],
    _sum: { score: true },
    _count: { id: true },
  });

  if (!usersScores.length) return null;

  const userIds = usersScores.map(u => u.userId);
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

  const mapped = usersScores.map(s => {
    const user = users.find(u => u.id === s.userId);
    const totalScore = s._sum.score || 0;
    const levelData = getLevelDataFromXP(totalScore);

    return {
      userId: s.userId,
      name: user?.name || 'Unknown',
      avatarPicId: user?.avatarPicId || null,
      totalScore,
      level: levelData.levelTitle,
      rank: levelData.levelNumber,
    };
  });

  mapped.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return b.totalScore - a.totalScore;
  });

  return {
    message: 'User ranking fetched successfully',
    topThree: mapped.slice(0, 3),
    remaining: mapped.slice(3),
    userDetails: mapped.find(u => u.userId === userId) || null,
  };
}




async getTeamRewardsSummary(teamId: number) {
  const latestRecords = await this.prisma.finalTeamScore.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  if (!latestRecords.length) return null

  const trophiesCount = latestRecords.filter(r => r.trophy).length
  const badgesCount = latestRecords.filter(r => r.badge).length
  const scoreList = latestRecords.map(r => r.score)

  const sumAchieved = latestRecords.reduce((sum, r) => sum + r.score, 0)
  const sumMax = latestRecords.length * 100
  const successRate = Math.round((sumAchieved / sumMax) * 100)

  // Fetch all records for the team
  const allRecords = await this.prisma.finalTeamScore.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate average score per field for the team
  const total = allRecords.reduce(
    (acc, r) => {
      acc.alignmentStrategy += r.alignmentStrategy
      acc.objectiveClarity += r.objectiveClarity
      acc.keyResultQuality += r.keyResultQuality
      acc.initiativeRelevance += r.initiativeRelevance
      acc.challengeAdoption += r.challengeAdoption
      acc.score += r.score
      return acc
    },
    {
      alignmentStrategy: 0,
      objectiveClarity: 0,
      keyResultQuality: 0,
      initiativeRelevance: 0,
      challengeAdoption: 0,
      score: 0,
    }
  )

  const count = allRecords.length
  const averages = {
    alignmentStrategy: total.alignmentStrategy / count,
    objectiveClarity: total.objectiveClarity / count,
    keyResultQuality: total.keyResultQuality / count,
    initiativeRelevance: total.initiativeRelevance / count,
    challengeAdoption: total.challengeAdoption / count,
  }

  const overallAverage = total.score / count

  return {
    teamId,
    totalRecords: allRecords.length,
    rewards: { trophies: trophiesCount, badges: badgesCount, scoreList },
    successRate,
    averages,
    overallAverage,
    allRecords,
  }
}



}
