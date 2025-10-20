import { Injectable } from '@nestjs/common';
import { llm } from '../../lib/llm/llm';
import { predictSuggestionPrompt } from '../../lib/prompt/predictSuggestionPrompt';
import { EvaluateSuggestionDto } from './dto/evaluate-suggestion.dto';
import { SuggestionResultDto } from './dto/suggestion-result.dto';
import { generateOrganizationPrompt } from '../../lib/prompt/generateOrganizationPrompt';

@Injectable()
export class SuggestionEvaluatorService {

  async evaluateWithLLM(input: EvaluateSuggestionDto): Promise<SuggestionResultDto> {
    const { strategy, role, industry, objective, keyResults, language } = input;

    if (!strategy || !role || !industry || !objective || !keyResults || !language) {
      throw new Error('All fields are required: strategy, role, industry, objective, keyResults, language');
    }

    const prompt = predictSuggestionPrompt(strategy, role, industry, objective, keyResults, language);
    const response = await llm.invoke(prompt);

    let raw: string;
    if (typeof response.content === 'string') {
      raw = response.content;
    } else if (Array.isArray(response.content)) {
      raw = response.content.map(item => ('text' in item ? item.text : JSON.stringify(item))).join(' ');
    } else {
      raw = JSON.stringify(response.content);
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI output');

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse AI JSON output');
    }
  }

  async generateOrganization(role: string, language: string) {
    if (!role || !language) throw new Error('Both role and language are required')

    const prompt = generateOrganizationPrompt(role, language)
    const response = await llm.invoke(prompt)

    let raw: string
    if (typeof response.content === 'string') raw = response.content
    else if (Array.isArray(response.content))
      raw = response.content.map(item => ('text' in item ? item.text : JSON.stringify(item))).join(' ')
    else raw = JSON.stringify(response.content)

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in AI output')

    return JSON.parse(jsonMatch[0])
  }


}
