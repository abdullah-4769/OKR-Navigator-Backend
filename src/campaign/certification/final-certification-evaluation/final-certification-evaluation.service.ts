// final-certification-evaluation.service.ts
import { Injectable } from '@nestjs/common';
import { llm } from '../../../lib/llm/llm';
import { GenerateScenarioDto } from './dto/generate-scenario.dto';
import { buildFinalCertificationEvaluationPrompt } from '../../../lib/prompt/final-certification-evaluation.prompt';

@Injectable()
export class FinalCertificationEvaluationService {
  async evaluate(dto: GenerateScenarioDto) {
    const prompt = buildFinalCertificationEvaluationPrompt(
      dto.scenarioContext,
      dto.selectedStrategy,
      dto.userObjective,
      dto.userKeyResult1,
      dto.userKeyResult2,
      dto.userInitiative1KR1,
      dto.userInitiative2KR1,
      dto.userInitiative1KR2,
      dto.userInitiative2KR2,
      dto.language || 'en',
    );

    const response = await llm.invoke([{ role: 'user', content: prompt }]);

    let text: string;
    if (typeof response.content === 'string') {
      text = response.content;
    } else {
      text = response.content.map((c: any) => c.text ?? '').join(' ');
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      return {
        error: 'Failed to parse LLM response',
        message: err.message,
        raw: text,
      };
    }
  }
}
