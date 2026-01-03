import { Controller, Post } from '@nestjs/common'
import { MailCron } from './mail.cron'

@Controller('mail')
export class MailController {
  constructor(private mailCron: MailCron) {}

  @Post('trigger-weekly')
  async triggerWeeklyMail() {
    console.log('Manual trigger for weekly mail started')
    await this.mailCron.handleWeeklyMail()
    console.log('Manual trigger completed')
    return { message: 'Weekly mail process triggered successfully' }
  }
}
