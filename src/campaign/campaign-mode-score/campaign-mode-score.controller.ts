import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CampaignModeScoreService } from './campaign-mode-score.service';
import { CreateCampaignModeScoreDto } from './dto/create-campaign-mode-score.dto';

@Controller('campaign-mode-score')
export class CampaignModeScoreController {
  constructor(private readonly service: CampaignModeScoreService) {}

  @Post()
  create(@Body() dto: CreateCampaignModeScoreDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUserId(userId); 
  }

  @Get('latest/:userId')
  findLatest(@Param('userId') userId: string) {
    return this.service.findLatestByUser(userId); 
  }


  @Get('ranking/:userId')
  async getRanking(@Param('userId') userId: string) {
    return this.service.getUserCampaignRanking(userId)
  }

}
