import { Processor, Process } from '@nestjs/bull'
import type { Job } from 'bull'
import { MailService } from './mail.service'

@Processor('weeklyMail')
export class MailWorker {
  constructor(private mailService: MailService) {}

  @Process()
  async handle(job: Job<any>) {
    console.log('--- Processing Job ---')
    console.log('Job ID:', job.id)
    console.log('Job data:', job.data)

    const { user, activity, type } = job.data

    const payload = {
      name: user.name,
      score: activity?.score || activity?.finalScore || 0,
      badge: activity?.badge || '',
      appLink: process.env.APP_URL,
      unsubscribeLink: `${process.env.APP_URL}/unsubscribe`,
    }

    console.log(`User: ${user.name} (${user.email}), Type: ${type}`)

    if (type === 'active') {
      console.log(`Sending active email to ${user.email}`)
      await this.mailService.sendWeeklyActive(user.email, payload)
    } else {
      console.log(`Sending inactive email to ${user.email}`)
      await this.mailService.sendWeeklyInactive(user.email, payload)
    }

    console.log(`Email sent to ${user.email} successfully`)
    console.log('--- Job Completed ---\n')
  }
}
