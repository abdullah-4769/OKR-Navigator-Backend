import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreatePointAdjustmentDto } from './dto/create-point-adjustment.dto';
import { UpdatePointAdjustmentDto } from './dto/update-point-adjustment.dto';
import { BatchUpdatePointAdjustmentDto } from './dto/batch-update-point-adjustment.dto';
import { PointAdjustment } from '@prisma/client';

@Injectable()
export class PointAdjustmentService {
  constructor(private prisma: PrismaService) {}

async findAll(): Promise<{ message: string; data: PointAdjustment[] }> {
  try {
    const data = await this.prisma.pointAdjustment.findMany({
      orderBy: { level: 'asc' },
    });

    if (!data.length) {
      return { message: 'No point adjustments found', data: [] };
    }

    return { message: 'Point adjustments fetched successfully', data };
  } catch (error) {
    throw new InternalServerErrorException('Failed to fetch point adjustments.');
  }
}


async create(data: CreatePointAdjustmentDto): Promise<{ message: string; data: PointAdjustment }> {
  try {
    const existingLevels = await this.prisma.pointAdjustment.findMany({
      orderBy: { level: 'asc' },
      select: { level: true },
    });

    const levels = existingLevels.map(l => l.level);

    if (levels.includes(data.level)) {
      throw new BadRequestException(`Level ${data.level} already exists.`);
    }

    // Find the first missing level
    let nextAllowedLevel = 1;
    for (const lvl of levels) {
      if (lvl !== nextAllowedLevel) break;
      nextAllowedLevel++;
    }

    if (data.level > nextAllowedLevel) {
      throw new BadRequestException(`Cannot skip levels. Next allowed level is ${nextAllowedLevel}.`);
    }

    const created = await this.prisma.pointAdjustment.create({ data });
    return { message: 'Point adjustment created successfully', data: created };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new InternalServerErrorException('Failed to create point adjustment.');
  }
}


  async createMultiple(dataArray: CreatePointAdjustmentDto[]): Promise<{ message: string }> {
    try {
      const existingLevels = await this.prisma.pointAdjustment.findMany({
        orderBy: { level: 'asc' },
        select: { level: true },
      });
      const levels = existingLevels.map(l => l.level);

      dataArray.forEach(dto => {
        if (levels.includes(dto.level)) {
          throw new BadRequestException(`Level ${dto.level} already exists.`);
        }
      });

      const maxLevel = levels.length ? Math.max(...levels) : 0;
      const sortedNewLevels = dataArray.map(d => d.level).sort((a, b) => a - b);

      if (sortedNewLevels[0] !== maxLevel + 1) {
        throw new BadRequestException(`Next level must be ${maxLevel + 1}.`);
      }

      for (let i = 1; i < sortedNewLevels.length; i++) {
        if (sortedNewLevels[i] !== sortedNewLevels[i - 1] + 1) {
          throw new BadRequestException('New levels must be sequential without gaps.');
        }
      }

      await this.prisma.pointAdjustment.createMany({ data: dataArray });
      return { message: 'Multiple point adjustments created successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create multiple point adjustments.');
    }
  }

  async update(id: string, data: UpdatePointAdjustmentDto): Promise<{ message: string; data: PointAdjustment }> {
    try {
      const existing = await this.prisma.pointAdjustment.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Point adjustment with id ${id} not found.`);

      const levels = (await this.prisma.pointAdjustment.findMany({ select: { level: true } })).map(l => l.level);

      if (data.level && data.level !== existing.level) {
        if (levels.includes(data.level)) {
          throw new BadRequestException(`Level ${data.level} already exists.`);
        }
        const maxLevel = Math.max(...levels.filter(l => l !== existing.level));
        if (data.level !== maxLevel + 1 && data.level !== existing.level) {
          throw new BadRequestException(`Level must be sequential. Next allowed level is ${maxLevel + 1}.`);
        }
      }

      const updated = await this.prisma.pointAdjustment.update({
        where: { id },
        data,
      });
      return { message: 'Point adjustment updated successfully', data: updated };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update point adjustment.');
    }
  }

async updateMultiple(dataArray: BatchUpdatePointAdjustmentDto[]): Promise<{ message: string; data: PointAdjustment[] }> {
  try {
    const updatedLevels = await Promise.all(
      dataArray.map(async item => {
        const existing = await this.prisma.pointAdjustment.findUnique({ where: { id: item.id } });
        if (!existing) throw new NotFoundException(`Point adjustment with id ${item.id} not found.`);

        const levelsFromDb = await this.prisma.pointAdjustment.findMany({ select: { level: true } });
        const levels: number[] = levelsFromDb
          .map(l => l.level)
          .filter((l): l is number => l !== undefined && l !== existing.level); // ensures only numbers

        if (item.level === undefined) {
          throw new BadRequestException('Level must be provided.');
        }

        if (levels.includes(item.level)) {
          throw new BadRequestException(`Level ${item.level} already exists.`);
        }

        const maxLevel = levels.length ? Math.max(...levels) : 0;

        if (item.level !== maxLevel + 1 && item.level !== existing.level) {
          throw new BadRequestException(`Level must be sequential. Next allowed level is ${maxLevel + 1}.`);
        }

        return this.prisma.pointAdjustment.update({
          where: { id: item.id },
          data: {
            level: item.level,
            xpRangeStart: item.xpRangeStart,
            title: item.title,
          },
        });
      }),
    );

    return { message: 'Multiple point adjustments updated successfully', data: updatedLevels };
  } catch (error) {
    if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
    throw new InternalServerErrorException('Failed to update multiple point adjustments.');
  }
}


  async delete(id: string): Promise<{ message: string; data: PointAdjustment }> {
    try {
      const deleted = await this.prisma.pointAdjustment.delete({ where: { id } });
      return { message: 'Point adjustment deleted successfully', data: deleted };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Point adjustment with id ${id} not found.`);
      }
      throw new InternalServerErrorException('Failed to delete point adjustment.');
    }
  }
}
