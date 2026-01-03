import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { BullModule } from '@nestjs/bull'
import { MailCron } from './mail.cron'
import { MailWorker } from './mail.worker'
import { MailController } from './mail.controller'
import { PrismaService } from '../lib/prisma/prisma.service';
@Module({
    imports: [
    BullModule.registerQueue({
      name: 'weeklyMail',
    }),
  ],
  providers: [MailService, MailCron, MailWorker, PrismaService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
