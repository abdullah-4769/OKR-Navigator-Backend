import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../lib/prisma/prisma.service'
import { CreateChallengeScoreDto } from './dto/create-challenge-score.dto'

@Injectable()
export class ChallengeModeScoreService {
  constructor(private prisma: PrismaService) {}

  async addScore(dto: CreateChallengeScoreDto) {
    const existing = await this.prisma.challengeModeScore.findMany({
      where: { challengeId: dto.challengeId },
    })

    if (existing.some(e => e.userId === dto.userId)) {
      throw new BadRequestException('User already submitted score')
    }

    if (existing.length >= 2) {
      throw new BadRequestException('Only two users allowed per challenge')
    }

    return await this.prisma.challengeModeScore.create({
      data: dto,
    })
  }

  async getScore(challengeId: number, userId: string) {
    const scores = await this.prisma.challengeModeScore.findMany({
      where: { challengeId },
      orderBy: { score: 'desc' },
    })

    if (scores.length === 0) {
      throw new NotFoundException('No scores found')
    }

    const sorted = scores.map((s, idx) => ({
      ...s,
      position: idx === 0 ? '1st' : '2nd',
    }))

    const userScore = sorted.find(s => s.userId === userId)
    if (!userScore) {
      throw new NotFoundException('User score not found')
    }

    const results = sorted.map(s => {
      if (s.userId === userId) {
        return {
          userId: s.userId,
          name: s.userId,
          score: s.score,
          position: s.position,
          alignmentStrategy: s.alignmentStrategy,
          objectiveClarity: s.objectiveClarity,
          keyResultQuality: s.keyResultQuality,
          initiativeRelevance: s.initiativeRelevance,
          challengeAdoption: s.challengeAdoption,
          strategyAlignment: s.strategyAlignment,
          objectiveAlignment: s.objectiveAlignment,
          keyResultQualityLog: s.keyResultQualityLog,
        }
      }

      return {
        userId: s.userId,
        name: s.userId,
        score: s.score,
        position: s.position,
      }
    })

    return { challengeId, results }
  }


async getUserChallengeRanking(userId: string) {
  const usersScores = await this.prisma.challengeModeScore.groupBy({
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
    if (percentage === 100) return 'Master / Navigator Certified'
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

  return {
    topThree: ranked.slice(0, 3),
    remaining: ranked.slice(3),
    userDetails: ranked.find(u => u.userId === userId) || null,
  }
}



}
