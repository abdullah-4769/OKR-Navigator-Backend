import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { BullModule } from '@nestjs/bull'
import { MailCron } from './mail.cron'
import { MailWorker } from './mail.worker'

@Module({
    imports: [
    BullModule.registerQueue({
      name: 'weeklyMail',
    }),
  ],
  providers: [MailService, MailCron, MailWorker],
  exports: [MailService],
})
export class MailModule {}
