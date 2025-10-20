// src/final-team-score/final-team-score.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../lib/prisma/prisma.service'
import { CreateFinalTeamScoreDto } from './dto/create-final-team-score.dto'

export interface TeamLevel {
  teamId: number
  teamName: string
  averageScore: number
  averageRemainingTime: number
  totalPoints: number
  trophyCount: number
  budgetCount: number
  playerAchievements: string[]
  level: number,
  successRate: number
}
@Injectable()
export class FinalTeamScoreService {
  constructor(private prisma: PrismaService) {}
  private mapPoints(value: number) {
    if (value >= 0 && value <= 10) return 0
    if (value > 10 && value <= 20) return 1
    return 2
  }


  async create(dto: CreateFinalTeamScoreDto) {
    const { badge, trophy } = this.assignRewards(dto.score)

    const totalScore =
      dto.alignmentStrategy +
      dto.objectiveClarity +
      dto.keyResultQuality +
      dto.initiativeRelevance +
      dto.challengeAdoption

    const avgPercentage = (totalScore / 100) * 100

    const saved = await this.prisma.finalTeamScore.create({
      data: {
        ...dto,
        badge,
        trophy,
        avgPercentage,
      },
    })

    // only keep allowed fields in response
    const { alignmentStrategy, objectiveClarity, keyResultQuality, initiativeRelevance, challengeAdoption, ...safe } =
      saved

    return {
      ...safe,
      alignmentPoints: this.assignPoints(dto.alignmentStrategy, 15),
      objectivePoints: this.assignPoints(dto.objectiveClarity, 15),
      keyResultPoints: this.assignPoints(dto.keyResultQuality, 30),
      initiativePoints: this.assignPoints(dto.initiativeRelevance, 30),
      challengePoints: this.assignPoints(dto.challengeAdoption, 10),
      totalPoints: this.calculateTotalPoints(dto),
    }
  }

  private assignRewards(score: number) {
    if (score === 100) return { badge: 'Platinum Star', trophy: 'Gold Trophy' }
    if (score >= 90) return { badge: 'Gold Star', trophy: 'Silver Trophy' }
    if (score >= 80) return { badge: 'Silver Star', trophy: '' }
    if (score >= 70) return { badge: 'Bronze Star', trophy: '' }
    return { badge: 'Participant', trophy: '' }
  }

  private assignPoints(value: number, max: number) {
    if (value === max) return 2
    if (value >= max / 2) return 1
    return 0
  }

  private calculateTotalPoints(dto: CreateFinalTeamScoreDto) {
    return (
      this.assignPoints(dto.alignmentStrategy, 15) +
      this.assignPoints(dto.objectiveClarity, 15) +
      this.assignPoints(dto.keyResultQuality, 30) +
      this.assignPoints(dto.initiativeRelevance, 30) +
      this.assignPoints(dto.challengeAdoption, 10)
    )
  }

async getTeamSummary(teamId: number) {

  const members = await this.prisma.teamMember.findMany({
    where: { teamId }
  })


  const scores = await this.prisma.finalTeamScore.findMany({
    where: { teamId }
  })


  const userIds = members.map(m => m.userId)
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } }
  })


  const mapPoints = (value: number) => {
    if (value >= 0 && value <= 10) return 0
    if (value > 10 && value <= 20) return 1
    return 2
  }


  const userAverage = members.map(member => {
    const userScore = scores.find(s => s.userId === member.userId)
    const user = users.find(u => u.id === member.userId)

    if (userScore) {
      return {
          userid: user?.id || 'Unknown',
        name: user?.name || 'Unknown',
        avatar: user?.avatarPicId || null,
        role: member.role,
        score: userScore.score
      }
    } else {
      return {
         userid: user?.id || 'Unknown',
        name: user?.name || 'Unknown',
        avatar: user?.avatarPicId || null,
        role: member.role,
        score: 'pending'
      }
    }
  })


  const submittedScores = scores.length
    ? {
        score: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
        title: scores.find(s => s)?.title || null,
        time: scores.find(s => s)?.time || null,
        badge: scores.find(s => s)?.badge || null,
        trophy: scores.find(s => s)?.trophy || null,
        avgPercentage:
          scores.reduce((sum, s) => sum + (s.avgPercentage || 0), 0) /
          scores.length,
        alignmentPoints:
          scores.reduce((sum, s) => sum + mapPoints(s.alignmentStrategy), 0) /
          scores.length,
        objectivePoints:
          scores.reduce((sum, s) => sum + mapPoints(s.objectiveClarity), 0) /
          scores.length,
        keyResultPoints:
          scores.reduce((sum, s) => sum + mapPoints(s.keyResultQuality), 0) /
          scores.length,
        initiativePoints:
          scores.reduce((sum, s) => sum + mapPoints(s.initiativeRelevance), 0) /
          scores.length,
        challengePoints:
          scores.reduce((sum, s) => sum + mapPoints(s.challengeAdoption), 0) /
          scores.length,
        totalPoints:
          scores.reduce(
            (sum, s) =>
              sum +
              mapPoints(s.alignmentStrategy) +
              mapPoints(s.objectiveClarity) +
              mapPoints(s.keyResultQuality) +
              mapPoints(s.initiativeRelevance) +
              mapPoints(s.challengeAdoption),
            0
          ) / scores.length
      }
    : null

  return {
    teamId,
    teamAverage: submittedScores,
    userAverage
  }
}

async getUserScore(teamId: number, userId: string) {
  const member = await this.prisma.teamMember.findFirst({
    where: { teamId, userId }
  })
  if (!member) return { message: 'User not part of this team' }

  const user = await this.prisma.user.findUnique({ where: { id: userId } })
  const score = await this.prisma.finalTeamScore.findFirst({
    where: { teamId, userId }
  })

  const mapPoints = (value: number) => (value <= 10 ? 0 : value <= 20 ? 1 : 2)

  if (!score) {
    return {
      name: user?.name || 'Unknown',
      avatar: user?.avatarPicId || null,
      role: member.role,
      score: 'pending'
    }
  }

  return {
    name: user?.name || 'Unknown',
    avatar: user?.avatarPicId || null,
    role: member.role,
    score: score.score,
    title: score.title,
    time: score.time,
    badge: score.badge,
    trophy: score.trophy,
    avgPercentage: score.avgPercentage,
    alignmentPoints: mapPoints(score.alignmentStrategy),
    objectivePoints: mapPoints(score.objectiveClarity),
    keyResultPoints: mapPoints(score.keyResultQuality),
    initiativePoints: mapPoints(score.initiativeRelevance),
    challengePoints: mapPoints(score.challengeAdoption),
    totalPoints:
      mapPoints(score.alignmentStrategy) +
      mapPoints(score.objectiveClarity) +
      mapPoints(score.keyResultQuality) +
      mapPoints(score.initiativeRelevance) +
      mapPoints(score.challengeAdoption)
  }
}

async getTeamLevel(teamId: number): Promise<TeamLevel | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) return null

    const scores = await this.prisma.finalTeamScore.findMany({
      where: { teamId },
    })

    if (!scores.length) return null

    const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    const averageRemainingTime =
      scores.reduce((sum, s) => sum + Number(s.time || 0), 0) / scores.length

    const totalPoints = scores.reduce(
      (sum, s) =>
        sum +
        this.mapPoints(s.alignmentStrategy) +
        this.mapPoints(s.objectiveClarity) +
        this.mapPoints(s.keyResultQuality) +
        this.mapPoints(s.initiativeRelevance) +
        this.mapPoints(s.challengeAdoption),
      0,
    )

    const trophyCount = scores.filter((s) => s.trophy).length
    const budgetCount = scores.filter((s) => s.badge).length
    const playerAchievements = scores.map((s) => s.title).filter((t): t is string => !!t)

    const maxRawScorePerPlayer = 100
    const maxTeamScore = maxRawScorePerPlayer * scores.length
    const successRate = (scores.reduce((sum, s) => sum + s.score, 0) / maxTeamScore) * 100

    const allTeams = await this.prisma.finalTeamScore.groupBy({
      by: ['teamId'],
      _avg: { score: true },
    })

    allTeams.sort((a, b) => (b._avg?.score || 0) - (a._avg?.score || 0))
    const level = allTeams.findIndex((t) => t.teamId === teamId) + 1

    return {
      teamId,
      teamName: team.title || '',
      averageScore,
      averageRemainingTime,
      totalPoints,
      trophyCount,
      budgetCount,
      playerAchievements,
      level,
      successRate,
    }
  }

async getPlayerRanking(userId: string) {
    const usersScores = await this.prisma.finalTeamScore.groupBy({
      by: ['userId'],
      _sum: { score: true },
      _count: { id: true },
      orderBy: { _sum: { score: 'desc' } },
    })

    if (!usersScores.length) return null

    const userIds = usersScores.map(u => u.userId)

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarPicId: true },
    })

    const getLevel = (totalScore: number, recordCount: number) => {
      const percentage = Math.round((totalScore / (recordCount * 100)) * 100)
      if (percentage === 100) return 'Master'
      if (percentage >= 90) return 'Expert'
      if (percentage >= 80) return 'Advanced'
      if (percentage >= 60) return 'Competent'
      if (percentage >= 40) return 'Beginner'
      return 'Novice'
    }

    const ranked = usersScores.map((s, index) => {
      const user = users.find(u => u.id === s.userId)
      const totalScore = s._sum.score || 0
      const recordCount = s._count.id || 1

      return {
        userId: s.userId,
        name: user?.name || 'Unknown',
        avatarPicId: user?.avatarPicId || null,
        totalScore,
        level: getLevel(totalScore, recordCount),
        rank: index + 1,
      }
    })

    const userDetails = ranked.find(u => u.userId === userId) || null

    return {
      topThree: ranked.slice(0, 3),
      remaining: ranked.slice(3),
      userDetails,
    }
  }

  
}
