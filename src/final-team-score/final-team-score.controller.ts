// src/final-team-score/final-team-score.controller.ts
import { Body, Controller, Post,Get,Param } from '@nestjs/common'
import { FinalTeamScoreService } from './final-team-score.service'
import { CreateFinalTeamScoreDto } from './dto/create-final-team-score.dto'

@Controller('final-team-score')
export class FinalTeamScoreController {
  constructor(private readonly finalTeamScoreService: FinalTeamScoreService) {}

  @Post()
  create(@Body() dto: CreateFinalTeamScoreDto) {
    return this.finalTeamScoreService.create(dto)
  }

  @Get(':teamId/summary')
  async getTeamSummary(@Param('teamId') teamId: string) {
    // Call service and return result
    return this.finalTeamScoreService.getTeamSummary(parseInt(teamId))
  }


    @Get(':teamId/user/:userId/score')
  async getUserScore(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string
  ) {
    return this.finalTeamScoreService.getUserScore(parseInt(teamId), userId)
  }



    @Get('successrate/:id')
  async getTeamLevel(@Param('id') id: string) {
    return this.finalTeamScoreService.getTeamLevel(Number(id));
  }


    @Get('player-ranking/:userId')
  async getPlayerRanking(@Param('userId') userId: string) {
    return this.finalTeamScoreService.getPlayerRanking(userId)
  }


}
