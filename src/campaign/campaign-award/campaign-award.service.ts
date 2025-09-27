import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

interface Score {
  userId: string
  totalScore: number | null
}

@Injectable()
export class CampaignAwardService {
  constructor(private readonly prisma: PrismaService) {}

  // assign rewards based on score
  private assignRewards(scores: Score[]) {
    return scores.map((member) => {
      const score = member.totalScore || 0
      let title = ''
      let badge = ''
      let trophy = ''

      if (score === 100) {
        title = 'Perfect Performer'
        badge = 'Platinum Star'
        trophy = 'Gold Trophy'
      } else if (score >= 90) {
        title = 'Top Performer'
        badge = 'Gold Star'
        trophy = 'Silver Trophy'
      } else if (score >= 80) {
        title = 'High Achiever'
        badge = 'Silver Star'
      } else if (score >= 70) {
        title = 'Rising Star'
        badge = 'Bronze Star'
      } else {
        title = 'Participant'
      }

      return { memberId: member.userId, title, badge, trophy }
    })
  }

  // get rewards for all users in a campaign
  async assignRewardsByCampaign(campaignId: number) {
    const scores = await this.prisma.campaignModeScore.findMany({
      where: { campaignId },
      select: { userId: true, totalScore: true },
    })
    return this.assignRewards(scores.map(s => ({ userId: s.userId!, totalScore: s.totalScore })))
  }

  // get rewards for a specific user
  async getRewardByUser(userId: string) {
    const scores = await this.prisma.campaignModeScore.findMany({
      where: { userId },
      select: { userId: true, totalScore: true },
    })
    return this.assignRewards(scores.map(s => ({ userId: s.userId!, totalScore: s.totalScore })))
  }

  // get rewards for a user in a specific campaign
  async getRewardByCampaignAndUser(campaignId: number, userId: string) {
    const scores = await this.prisma.campaignModeScore.findMany({
      where: { campaignId, userId },
      select: { userId: true, totalScore: true },
    })
    return this.assignRewards(scores.map(s => ({ userId: s.userId!, totalScore: s.totalScore })))
  }

  async getLatestResultByUser(userId: string) {
    const latest = await this.prisma.campaignModeScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        campaignId: true,
        level: true,
        sector: true,
        role: true,
        strategyScore: true,
        objectiveScore: true,
        keyResultScore: true,
        initiativeScore: true,
        challengeScore: true,
        strengths: true,
        improvement: true,
        totalScore: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!latest) return null

    const reward = this.assignRewards([{ userId: latest.userId!, totalScore: latest.totalScore }])[0]

    return { ...latest, ...reward }
  }


  async getUserSummary(userId: string) {
    const scores = await this.prisma.campaignModeScore.findMany({
      where: { userId },
      select: { userId: true, totalScore: true, level: true },
    })

    const certificationScores = scores.filter(s => s.level === 3)

    if (!certificationScores.length) {
      return { totalBudget: 0, budgets: [], totalCertifications: 0 }
    }

    const rewards = this.assignRewards(
      certificationScores.map(s => ({ userId: s.userId!, totalScore: s.totalScore })),
    )

    const budgets = rewards.filter(r => r.badge).map(r => r.badge)
    const totalBudget = budgets.length
    const totalCertifications = certificationScores.length

    return { totalBudget, budgets, totalCertifications }
  }

async getUserCertifications(userId: string) {
  const scores = await this.prisma.campaignModeScore.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      totalScore: true,
      strengths: true,
      createdAt: true, // include date
    },
  })

  const totalEarned = scores.length

  const rewards = this.assignRewards(
    scores.map(s => ({ userId: s.userId!, totalScore: s.totalScore ?? 0 }))
  )

  const certifications = rewards
    .filter(r => r.badge !== '')
    .map((r, index) => {
      const score = scores[index].totalScore ?? 0
      let title = ''
      let badge = ''

      if (score >= 90) {
        badge = 'Gold Badge'
        title = 'Navigator Expert Certificate'
      } else if (score >= 80) {
        badge = 'Silver Badge'
        title = 'Confirmed Navigator Certificate'
      } else if (score >= 70) {
        badge = 'Bronze Badge'
        title = 'Attestation of Participation'
      } else {
        badge = 'Feedback'
        title = 'Recommendation to replay the challenge'
      }

      return {
        id: scores[index].id,
        memberId: r.memberId,
        title,
        badge,
        strengths: scores[index].strengths,
        totalScore: score,
        date: scores[index].createdAt, // add date here
      }
    })

  return {
    progress: { earned: totalEarned, total: totalEarned },
    certifications,
  }
}



async getCertificationById(userId: string, certId: number) {
    const cert = await this.prisma.campaignModeScore.findFirst({
      where: { userId, id: certId, level: 3 },
      select: {
        id: true,
        userId: true,
        campaignId: true,
        level: true,
        sector: true,
        role: true,
        strengths: true,
        improvement: true,
        totalScore: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!cert) return null

    const reward = this.assignRewards([{ userId: cert.userId!, totalScore: cert.totalScore }])[0]

    let certificateTitle = ''
    if (reward.badge === 'Platinum Star' || reward.badge === 'Gold Star') certificateTitle = 'Navigator Expert Certificate'
    else if (reward.badge === 'Silver Star') certificateTitle = 'Confirmed Navigator Certificate'
    else if (reward.badge === 'Bronze Star') certificateTitle = 'Attestation of Participation'

    return {
      ...cert,
      memberId: reward.memberId,
      badge: reward.badge,
      trophy: reward.trophy,
      title: certificateTitle,
      totalScore: cert.totalScore,
    }
  }




}
