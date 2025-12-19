import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateBonusScoreDto } from './dto/create-bonus-score.dto';
import { UpdateBonusScoreDto } from './dto/update-bonus-score.dto';
import { bonusScenario } from '../lib/prompt/bonusScenarioPrompt'
import { llm } from '../lib/llm/llm'
import { evaluateBonusResponse } from '../lib/prompt/evaluateBonusResponse';


@Injectable()
export class BonusScoreService {
  constructor(private prisma: PrismaService) {}

create(data: CreateBonusScoreDto) {
  return this.prisma.bonusScore.create({
    data: {
      userId: data.userId,
      overallScore: data.overallScore,
      status: data.status,
      feedbackText: data.feedbackText,
      feedbackTone: data.feedbackTone,
      feedbackTip: data.feedbackTip,
      strengths: data.strengths,
      improvements: data.improvements,
      badge: data.badge,
      title: data.title,
      scenarioDescription: data.scenarioDescription
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


async generateBonusScenario(role: string, industry: string, language: string) {
  const prompt = bonusScenario(role, industry, language)

  let scenarioData: { title: string; description: string;  } = {
    title: '',
    description: '',

  }

  try {
    const response = await llm.call([{ role: 'system', content: prompt }])
    let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const data = JSON.parse(text)

    scenarioData = {
      title: data.title ?? '',
      description: data.description ?? '',

    }
  } catch (err) {
    scenarioData = {
      title: 'Scenario generation failed',
      description: 'Unable to generate scenario at this time.',
    }
  }

  return scenarioData
}

 async evaluateBonus(userResponse: string, scenarioTitle: string, scenarioDescription: string, language: string) {
    const prompt = evaluateBonusResponse(scenarioTitle, scenarioDescription, userResponse, language);

    try {
      const response = await llm.call([{ role: 'system', content: prompt }]);
      let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(text);
      return data;
    } catch (err) {
      return {
        score: 0,
        status: 'Rejected',
        feedback: {
          text: 'Evaluation failed',
          tone: 'corrective',
          tip: 'Try again later',
        },
      };
    }
  }
  
}
