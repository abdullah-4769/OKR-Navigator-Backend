import { Controller, Get, Post, Body, Param, Patch,ParseIntPipe, Delete } from '@nestjs/common';
import { SoloScoreService, CreateSoloScoreDto } from './solo-score.service';

@Controller('solo-score')
export class SoloScoreController {
  constructor(private readonly soloScoreService: SoloScoreService) {}

  @Post()
  create(@Body() data: CreateSoloScoreDto) {
    return this.soloScoreService.create(data);
  }

  @Get()
  findAll() {
    return this.soloScoreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.soloScoreService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateSoloScoreDto>) {
    return this.soloScoreService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.soloScoreService.remove(id);
  }
  
  @Get('user-all/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.soloScoreService.findByUser(userId);
  }

  @Get('user/:userId/latest')
  findLatestByUser(@Param('userId') userId: string) {
    return this.soloScoreService.findLatestByUser(userId);
  }

  @Get('user/:userId/rewards-summary')
  getUserRewardsSummary(@Param('userId') userId: string) {
    return this.soloScoreService.getUserRewardsSummary(userId);
  }

  @Get('user/:userId/ranking')
  getUserRanking(@Param('userId') userId: string) {
    return this.soloScoreService.getUserRanking(userId);
  }

  
}
