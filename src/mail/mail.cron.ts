import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../lib/prisma/prisma.service'
import { MailService } from './mail.service'

@Injectable()
export class MailCron {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @Cron('0 9 * * 1') // every Monday at 9 AM
  async handleWeeklyMail() {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    lastWeek.setHours(0, 0, 0, 0)

    const users = await this.prisma.user.findMany({
      where: { role: { not: 'admin' } },
    })

    for (const user of users) {
      let type: 'active' | 'inactive' = 'inactive'
      let activity: any = null

      const bonus = await this.prisma.bonusScore.findFirst({
        where: { userId: user.id, createdAt: { gte: lastWeek } },
      })
      if (bonus) activity = bonus

      if (!activity) {
        const solo = await this.prisma.soloScore.findFirst({
          where: { userId: user.id, createdAt: { gte: lastWeek } },
        })
        if (solo) activity = solo
      }

      if (!activity) {
        const team = await this.prisma.finalTeamScore.findFirst({
          where: { userId: user.id, createdAt: { gte: lastWeek } },
        })
        if (team) activity = team
      }

      if (activity) type = 'active'

      const payload = {
        name: user.name,
        score: activity?.score || activity?.finalScore || 0,
        badge: activity?.badge || '',
        appLink: process.env.APP_URL,
        unsubscribeLink: `${process.env.APP_URL}/unsubscribe`,
      }

      try {
        if (type === 'active') {
          await this.mailService.sendWeeklyActive(user.email, payload)
        } else {
          await this.mailService.sendWeeklyInactive(user.email, payload)
        }
      } catch (err) {
        // handle error if needed
      }
    }
  }
}
