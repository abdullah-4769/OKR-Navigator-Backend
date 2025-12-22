import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { BonusScoreService } from './bonus-score.service';
import { CreateBonusScoreDto } from './dto/create-bonus-score.dto';
import { UpdateBonusScoreDto } from './dto/update-bonus-score.dto';

@Controller('bonus-score')
export class BonusScoreController {
  constructor(private readonly bonusScoreService: BonusScoreService) {}

  @Post()
  create(@Body() createBonusScoreDto: CreateBonusScoreDto) {
    return this.bonusScoreService.create(createBonusScoreDto);
  }

  @Get('latest/:userId')
  getLatestByUser(@Param('userId') userId: string) {
    return this.bonusScoreService.findLatestByUser(userId);
  }

  // 2. Check if user has a record today
  @Get('check-today/:userId')
  checkToday(@Param('userId') userId: string) {
    return this.bonusScoreService.checkTodayScore(userId);
  }


  @Post('generate-scenario')
  async generateScenario(
    @Body('role') role: string,
    @Body('industry') industry: string,
    @Body('language') language: string,
  ) {
    return this.bonusScoreService.generateDailyTrainingCase(role, industry, language);
  }

@Post('evaluate-response')
async evaluateResponse(
  @Body('userResponse') userResponse: string,
  @Body('industry') industry: string,
  @Body('vision') vision: string,
  @Body('strategy') strategy: string,
  @Body('problems') problems: string,
  @Body('language') language: string,
) {
  return this.bonusScoreService.evaluateDailyTraining(
    userResponse,
    industry,
    vision,
    strategy,
    problems,
    language
  );
}

@Get('streak/:userId')
async getUserStreak(@Param('userId') userId: string) {
  const streak = await this.bonusScoreService.getUserStreak(userId)

  return {
    streak,
    message: `Your last streak is ${streak} days`
  }
}




}
