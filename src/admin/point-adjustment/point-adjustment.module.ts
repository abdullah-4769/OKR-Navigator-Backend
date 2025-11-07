import { Module } from '@nestjs/common';
import { PointAdjustmentService } from './point-adjustment.service';
import { PointAdjustmentController } from './point-adjustment.controller';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Module({
  controllers: [PointAdjustmentController],
  providers: [PointAdjustmentService, PrismaService],
})
export class PointAdjustmentModule {}
