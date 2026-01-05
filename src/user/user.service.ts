import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        where: { role: { not: 'admin' } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          language: true,
          avatarPicId: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      await this.prisma.challengeInvitation.deleteMany({ where: { playerId: id } });
      await this.prisma.challenge.deleteMany({ where: { hostId: id } });

      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new InternalServerErrorException('Cannot delete user due to related records');
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async toggleBlock(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      return await this.prisma.user.update({
        where: { id },
        data: { isBlocked: !user.isBlocked },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to toggle block status');
    }
  }



async getUserProfileWithStats(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarPicId: true,
      lastActiveAt: true
    }
  });

  if (!user) throw new NotFoundException('User not found');

  // Aggregate queries in parallel, optimized
  const [soloAgg, teamAgg, challengeAgg, bonusAgg, totalUsers, campaignCount] = await Promise.all([
    this.prisma.soloScore.aggregate({
      where: { userId },
      _sum: { score: true }
    }),
    this.prisma.finalTeamScore.aggregate({
      where: { userId },
      _sum: { score: true }
    }),
    this.prisma.challengeModeScore.aggregate({
      where: { userId },
      _sum: { score: true }
    }),
    this.prisma.bonusScore.aggregate({
      where: { userId },
      _sum: { finalScore: true }
    }),
    this.prisma.user.count(),
    this.prisma.campaignModeScore.count({ where: { userId } })
  ]);

  const soloXp = soloAgg._sum.score || 0;
  const teamXp = teamAgg._sum.score || 0;
  const challengeXp = challengeAgg._sum.score || 0;
  const bonusXp = bonusAgg._sum.finalScore || 0;
  const totalXp = soloXp + teamXp + challengeXp + bonusXp;

  const level = await this.prisma.pointAdjustment.findFirst({
    where: { xpRangeStart: { lte: totalXp } },
    orderBy: { xpRangeStart: 'desc' }
  });

  // Optimized leaderboard using only necessary fields
  const leaderboardRaw: { userId: string; total: number }[] = await this.prisma.$queryRaw`
    SELECT u.id as "userId",
           COALESCE(s.scoreSum,0) + COALESCE(t.scoreSum,0) + COALESCE(c.scoreSum,0) + COALESCE(b.scoreSum,0) as total
    FROM "User" u
    LEFT JOIN (
      SELECT "userId", SUM(score) as scoreSum FROM "SoloScore" GROUP BY "userId"
    ) s ON u.id = s."userId"
    LEFT JOIN (
      SELECT "userId", SUM(score) as scoreSum FROM "FinalTeamScore" GROUP BY "userId"
    ) t ON u.id = t."userId"
    LEFT JOIN (
      SELECT "userId", SUM(score) as scoreSum FROM "ChallengeModeScore" GROUP BY "userId"
    ) c ON u.id = c."userId"
    LEFT JOIN (
      SELECT "userId", SUM("finalScore") as scoreSum FROM "BonusScore" GROUP BY "userId"
    ) b ON u.id = b."userId"
    ORDER BY total DESC
  `;

  const rankIndex = leaderboardRaw.findIndex(l => l.userId === userId);
  const globalRank = rankIndex >= 0 ? rankIndex + 1 : totalUsers;

  return {
    data: {
      user,
      xp: {
        total: totalXp,
        level: level?.level || 1,
        title: level?.title || 'Newcomer'
      },
      ranking: {
        globalRank,
        totalUsers
      },
      certificates: campaignCount,
      meta: {
        soloXp,
        teamXp,
        challengeXp,
        bonusXp
      }
    }
  };
}




}
