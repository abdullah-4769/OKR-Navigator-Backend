import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
type DailyReportItem = {
  date: string
  newRegistrations: number
  activeUsers: number
}
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
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  // Delete invitations where the user is the player
  await this.prisma.challengeInvitation.deleteMany({ where: { playerId: id } });

  // Find all challenges hosted by the user
  const challenges = await this.prisma.challenge.findMany({ where: { hostId: id }, select: { id: true } });
  const challengeIds = challenges.map(c => c.id);

  // Delete all invitations for those challenges
  if (challengeIds.length > 0) {
    await this.prisma.challengeInvitation.deleteMany({ where: { challengeId: { in: challengeIds } } });
  }

  // Delete the challenges hosted by the user
  await this.prisma.challenge.deleteMany({ where: { hostId: id } });

  // Delete other related records
  await this.prisma.challengeModeScore.deleteMany({ where: { userId: id } });
  await this.prisma.teamMember.deleteMany({ where: { userId: id } });
  await this.prisma.soloScore.deleteMany({ where: { userId: id } });
  await this.prisma.finalTeamScore.deleteMany({ where: { userId: id } });
  await this.prisma.campaignSession.deleteMany({ where: { playerId: id } });
  await this.prisma.campaignModeScore.deleteMany({ where: { userId: id } });
  await this.prisma.userAutoJoin.deleteMany({ where: { userId: id } });
  await this.prisma.subscription.deleteMany({ where: { userId: id } });
  await this.prisma.bonusScore.deleteMany({ where: { userId: id } });
  await this.prisma.userRole.deleteMany({ where: { userId: id } });

  // Finally, delete the user
  return await this.prisma.user.delete({ where: { id } });
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
       isBlocked: true,
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


async getWeeklyAiPerformance() {
  const now = new Date()
  const weekStart = new Date()
  weekStart.setDate(now.getDate() - 7)
  
  // 1. Get active users
  const activeUsers = await this.prisma.user.findMany({
    where: { lastActiveAt: { gte: weekStart } },
    select: { id: true }
  })
  
  if (activeUsers.length === 0) {
    return { eligible: false, reason: 'No active users this week' }
  }
  
  const userIds = activeUsers.map(u => u.id)
  
  // 2. Aggregate scores in parallel
  const [soloStats, teamStats, campaignStats] = await Promise.all([
    this.prisma.soloScore.aggregate({
      _count: true,
      _avg: { score: true },
      where: {
        userId: { in: userIds },
        createdAt: { gte: weekStart }
      }
    }),
    this.prisma.finalTeamScore.aggregate({
      _count: true,
      _avg: { score: true },
      where: {
        userId: { in: userIds },
        createdAt: { gte: weekStart }
      }
    }),
    this.prisma.campaignModeScore.aggregate({
      _count: true,
      _avg: { totalScore: true },
      where: {
        userId: { in: userIds },
        createdAt: { gte: weekStart }
      }
    })
  ])
  
  // 3. Helper function: calculate performance
  const calculate = (avg: number) => {
    const average = avg
    let status = 'Good'
    if (average < 80) status = 'Poor'
    else if (average > 90) status = 'Needs Improvement'
    
    let description = ''
    if (status === 'Good') description = 'The AI performance is satisfactory this week.'
    if (status === 'Poor') description = 'The AI performance needs attention and improvement.'
    if (status === 'Needs Improvement') description = 'The AI performance is high but could be optimized further.'
    
    return { averageScore: average, aiPerformanceStatus: status, description }
  }
  
  // 4. Safely extract averages
  const solo = calculate(soloStats._avg?.score ?? 0)
  const team = calculate(teamStats._avg?.score ?? 0)
  const campaign = calculate(campaignStats._avg?.totalScore ?? 0)
  
  // 5. Overall average safely
  const overallScores: number[] = []
  if (soloStats._avg?.score != null) overallScores.push(soloStats._avg.score)
  if (teamStats._avg?.score != null) overallScores.push(teamStats._avg.score)
  if (campaignStats._avg?.totalScore != null) overallScores.push(campaignStats._avg.totalScore)
  
  const overallAvg = overallScores.length
    ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
    : 0
  
  const overall = calculate(overallAvg)
  
  return { eligible: true, overall, solo, team, campaign }
}

async getWeeklyUserReport() {
    const now = new Date()
    const weekStart = new Date()
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date()
    weekEnd.setHours(23, 59, 59, 999)

    const createdUsers = await this.prisma.user.findMany({ where: { createdAt: { gte: weekStart, lte: weekEnd } }, select: { createdAt: true } })
    const activeUsers = await this.prisma.user.findMany({ where: { lastActiveAt: { gte: weekStart, lte: weekEnd } }, select: { lastActiveAt: true } })

    const dailyReport: DailyReportItem[] = []

    for (let i = 0; i < 7; i++) {
      const day = new Date()
      day.setDate(now.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const newRegistrations = createdUsers.filter(u => u.createdAt >= day && u.createdAt <= dayEnd).length
      const activeCount = activeUsers.filter(u => u.lastActiveAt && u.lastActiveAt >= day && u.lastActiveAt <= dayEnd).length

     const localDate = day.toLocaleDateString('en-CA') // format: YYYY-MM-DD
dailyReport.unshift({ date: localDate, newRegistrations, activeUsers: activeCount })

    }

    const totalUsers = await this.prisma.user.count()
    const totalSubscriptions = await this.prisma.subscription.count({ where: { active: true } })
    const activeUserIds = (await this.prisma.user.findMany({ where: { lastActiveAt: { gte: weekStart } }, select: { id: true } })).map(u => u.id)

    const [soloStats, teamStats, campaignStats] = await Promise.all([
      this.prisma.soloScore.aggregate({ _avg: { score: true }, where: { userId: { in: activeUserIds }, createdAt: { gte: weekStart } } }),
      this.prisma.finalTeamScore.aggregate({ _avg: { score: true }, where: { userId: { in: activeUserIds }, createdAt: { gte: weekStart } } }),
      this.prisma.campaignModeScore.aggregate({ _avg: { totalScore: true }, where: { userId: { in: activeUserIds }, createdAt: { gte: weekStart } } })
    ])

    const scores = [soloStats._avg?.score ?? 0, teamStats._avg?.score ?? 0, campaignStats._avg?.totalScore ?? 0].filter(s => s > 0)
    const overallAiPerf = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    return { weekly: dailyReport, summary: { totalUsers, aiPerformance: overallAiPerf + '%', totalSubscriptions } }
  }


}
