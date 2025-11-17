import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';
import { PrismaService } from '../lib/prisma/prisma.service';

@Module({
  controllers: [GoogleController],
  providers: [GoogleService, PrismaService],
})
export class GoogleModule {}
