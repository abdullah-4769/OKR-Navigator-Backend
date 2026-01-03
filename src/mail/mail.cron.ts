import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bull'
import type { Queue } from 'bull'
import { PrismaService } from '../lib/prisma/prisma.service'

interface WeeklyMailJob {
  user: any
  activity: any
  type: 'active' | 'inactive'
}

@Injectable()
export class MailCron {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('weeklyMail') private queue: Queue<WeeklyMailJob>,
  ) {}

  @Cron('0 9 * * 1')
  async handleWeeklyMail() {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const users = await this.prisma.user.findMany({
      where: {
        role: { not: 'admin' },
      },
    })

    for (const user of users) {
      let type: 'active' | 'inactive' = 'inactive'
      let activity: any = null

      const bonus = await this.prisma.bonusScore.findFirst({
        where: { userId: user.id, createdAt: { gte: lastWeek } },
        orderBy: { createdAt: 'desc' },
      })
      if (bonus) {
        activity = bonus
        type = 'active'
      }

      if (!activity) {
        const solo = await this.prisma.soloScore.findFirst({
          where: { userId: user.id, createdAt: { gte: lastWeek } },
          orderBy: { createdAt: 'desc' },
        })
        if (solo) {
          activity = solo
          type = 'active'
        }
      }

      if (!activity) {
        const team = await this.prisma.finalTeamScore.findFirst({
          where: { userId: user.id, createdAt: { gte: lastWeek } },
          orderBy: { createdAt: 'desc' },
        })
        if (team) {
          activity = team
          type = 'active'
        }
      }

      await this.queue.add({ user, activity, type })
    }
  }
}
