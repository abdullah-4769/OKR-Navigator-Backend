import { Controller, Post, Body } from '@nestjs/common';
import { SuggestionEvaluatorService } from './suggestion-evaluator.service';
import { EvaluateSuggestionDto } from './dto/evaluate-suggestion.dto';
import { SuggestionResultDto } from './dto/suggestion-result.dto';

@Controller('campaign/ai/suggestion')
export class SuggestionEvaluatorController {
  constructor(private readonly evaluatorService: SuggestionEvaluatorService) {}

  @Post('evaluate')
  async evaluate(@Body() body: EvaluateSuggestionDto): Promise<SuggestionResultDto> {
    return this.evaluatorService.evaluateWithLLM(body);
  }



  @Post('organization/generate')
async generate(@Body() body: { role: string; language: string }) {
  return this.evaluatorService.generateOrganization(body.role, body.language);
}

}
