import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateBonusScoreDto } from './dto/create-bonus-score.dto';
import { UpdateBonusScoreDto } from './dto/update-bonus-score.dto';
import { dailyTrainingCase } from '../lib/prompt/bonusScenarioPrompt'
import { llm } from '../lib/llm/llm'
import { evaluateDailyTrainingResponse } from '../lib/prompt/evaluateBonusResponse';


@Injectable()
export class BonusScoreService {
  constructor(private prisma: PrismaService) {}

create(data: CreateBonusScoreDto) {
  return this.prisma.bonusScore.create({
    data: {
      userId: data.userId,
      finalScore: data.finalScore,
      badge: data.badge || 'None',
      dimensionScores: data.dimensionScores || {},
      feedback: data.feedback || {},
      strengths: data.strengths || [],
      improvements: data.improvements || []
    }
  });
}







  async findLatestByUser(userId: string) {
    return this.prisma.bonusScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

 async checkTodayScore(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const record = await this.prisma.bonusScore.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return { exists: !!record };
  }


async generateDailyTrainingCase(role: string, industry: string, language: string) {
  const prompt = dailyTrainingCase(role, industry, language)

  let caseData: {
    industry: string
    vision: string
    strategy: string
    problems: string[]
  } = {
    industry,
    vision: '',
    strategy: '',
    problems: []
  }

  try {
    const response = await llm.call([{ role: 'system', content: prompt }])
    let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const data = JSON.parse(text)

    caseData = {
      industry,
      vision: data.vision ?? '',
      strategy: data.strategy ?? '',
      problems: Array.isArray(data.problems) ? data.problems : []
    }
  } catch (err) {
    caseData = {
      industry,
      vision: '',
      strategy: '',
      problems: []
    }
  }

  return caseData
}



async evaluateDailyTraining(
  userResponse: string,
  industry: string,
  vision: string,
  strategy: string,
  problems: string,
  language: string
) {
  const prompt = evaluateDailyTrainingResponse(industry, vision, strategy, problems, userResponse, language);

  try {
    const response = await llm.call([{ role: 'system', content: prompt }]);
    let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    const objectiveScore = data.dimension_scores?.objective ?? 0;
    const keyResultsScore = data.dimension_scores?.key_results ?? 0;
    const initiativesScore = data.dimension_scores?.initiatives ?? 0;
    const alignmentScore = data.dimension_scores?.alignment ?? 0;
    const relevanceScore = data.dimension_scores?.relevance ?? 0;

    const finalScore =
      objectiveScore * 0.15 +
      keyResultsScore * 0.30 +
      initiativesScore * 0.30 +
      alignmentScore * 0.10 +
      relevanceScore * 0.15;

    const validationPass = finalScore >= 80;

    let badge = 'None';
    if (finalScore >= 90) badge = 'Gold';
    else if (finalScore >= 80) badge = 'Silver';
    else if (finalScore >= 70) badge = 'Bronze';

    const feedback = data.feedback?.[0] ?? {};
    const strengths = feedback.strengths?.slice(0, 2) ?? ['Good effort', 'Well structured'];
    const improvements = feedback.improvements?.slice(0, 2) ?? ['Clarify objectives', 'Better alignment'];

    return {
      finalscore: Math.round(finalScore),
      dimensionscores: {
        objective: objectiveScore,
        keyresults: keyResultsScore,
        initiatives: initiativesScore,
        alignment: alignmentScore,
        relevance: relevanceScore,
      },
      badge: badge,
      feedback: [
        {
          text: feedback.text ?? 'No feedback provided',
          tone: feedback.tone ?? 'neutral',
          tip: feedback.tip ?? (validationPass ? '' : 'Focus on measurable objectives'),
          strengths,
          improvements,
        },
      ],
 
    };
  } catch (err) {
    return {
      finalscore: 0,
      dimensionscores: {
        objective: 0,
        keyresults: 0,
        initiatives: 0,
        alignment: 0,
        relevance: 0,
      },
      badge: '',
      feedback: [
        {
          text: 'Evaluation failed',
          tone: 'corrective',
          tip: 'Try again later',
          strengths: ['No strengths recorded'],
          improvements: ['Resubmit response'],
        },
      ],
    };
  }
}



  
}
