// src/challenge-mode-score/challenge-mode-score.controller.ts
import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { ChallengeModeScoreService } from './challenge-mode-score.service'
import { CreateChallengeScoreDto } from './dto/create-challenge-score.dto'

@Controller('challenge-mode-score')
export class ChallengeModeScoreController {
  constructor(private service: ChallengeModeScoreService) {}

  @Post()
  async addScore(@Body() dto: CreateChallengeScoreDto) {
    return this.service.addScore(dto)
  }

  @Get()
  async getScore(@Query('challengeId') challengeId: number, @Query('userId') userId: string) {
    return this.service.getScore(+challengeId, userId)
  }
}
