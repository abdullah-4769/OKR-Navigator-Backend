import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { PointAdjustmentService } from './point-adjustment.service';
import { CreatePointAdjustmentDto } from './dto/create-point-adjustment.dto';
import { UpdatePointAdjustmentDto } from './dto/update-point-adjustment.dto';
import { BatchUpdatePointAdjustmentDto } from './dto/batch-update-point-adjustment.dto';

@Controller('admin/point-adjustment')
export class PointAdjustmentController {
  constructor(private readonly service: PointAdjustmentService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: CreatePointAdjustmentDto) {
    return this.service.create(data);
  }

  @Post('batch')
  createBatch(@Body() dataArray: CreatePointAdjustmentDto[]) {
    return this.service.createMultiple(dataArray);
  }


    @Patch('batch')
  updateBatch(@Body() dataArray: BatchUpdatePointAdjustmentDto[]) {
    return this.service.updateMultiple(dataArray);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdatePointAdjustmentDto) {
    return this.service.update(id, data);
  }





  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
