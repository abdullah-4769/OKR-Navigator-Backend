import { Processor, Process } from '@nestjs/bull'
import type { Job } from 'bull'
import { MailService } from './mail.service'

@Processor('weeklyMail')
export class MailWorker {
  constructor(private mailService: MailService) {}

  @Process()
  async handle(job: Job<any>) {
    const { user, activity, type } = job.data

    const payload = {
      name: user.name,
      score: activity?.score || activity?.finalScore || 0,
      badge: activity?.badge || '',
      appLink: process.env.APP_URL,
      unsubscribeLink: `${process.env.APP_URL}/unsubscribe`,
    }

    if (type === 'active') {
      await this.mailService.sendWeeklyActive(user.email, payload)
    } else {
      await this.mailService.sendWeeklyInactive(user.email, payload)
    }
  }
}
