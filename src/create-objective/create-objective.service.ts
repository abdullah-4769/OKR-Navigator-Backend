import { Injectable } from '@nestjs/common'
import { PrismaService } from '../lib/prisma/prisma.service'
import { llm } from '../lib/llm/llm'
import { okrPrompt } from '../lib/prompt/createObjective'

@Injectable()
export class CreateObjectiveService {
  private cache = new Map<string, any>()
  private fetchCounts: Map<number, number> = new Map()

  constructor(private prisma: PrismaService) {}

// service
async generateAndSaveObjectives(
  strategyId: number,
  strategy: string,
  role: string,
  industry: string,
  language: string,
) {
  const prompt = okrPrompt(strategy, role, industry, language)

  let objectivesData: Array<{ title: string; description?: string }> = []

  try {
    const response = await llm.call([{ role: 'system', content: prompt }])
    const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const data = JSON.parse(text)

    if (Array.isArray(data.okrs)) {
      objectivesData = data.okrs.map(o => ({
        title: o.title?.trim() || '',
        description: o.description?.slice(0, 120)?.trim() || null,
      }))
    }
  } catch (err) {
    console.error('Error generating objectives:', err)
    return { error: 'Failed to generate OKRs' }
  }

  if (objectivesData.length === 0) {
    return { error: 'No objectives generated' }
  }

  const dbData = objectivesData.map(obj => ({
    strategyId,
    title: obj.title,
    description: obj.description,
  }))

  await this.prisma.objective.deleteMany({ where: { strategyId } })
  await this.prisma.objective.createMany({ data: dbData })

  return { message: 'Objectives saved', objectives: objectivesData }
}






async getObjectives(strategyId?: number) {
  if (!strategyId) {
    return this.prisma.objective.findMany({
      orderBy: { id: 'asc' },
    })
  }

  const count = this.fetchCounts.get(strategyId) || 0
  const maxAttempts = 3
  const remaining = Math.max(0, maxAttempts - count)

  if (count >= maxAttempts) {
    return { error: 'Fetch limit reached (3 times only) for this strategy', remainingAttempts: 0 }
  }

  this.fetchCounts.set(strategyId, count + 1)

  const objectives = await this.prisma.objective.findMany({
    where: { strategyId },
    orderBy: { id: 'asc' },
  })

  return { objectives, remainingAttempts: remaining - 1 }
}

async getObjectivesWithoutLimit(strategyId: number) {
  return this.prisma.objective.findMany({
    where: { strategyId },
    orderBy: { id: 'asc' },
  })
}





}
