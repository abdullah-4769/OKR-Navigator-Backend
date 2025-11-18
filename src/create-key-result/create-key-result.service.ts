import { Injectable } from '@nestjs/common'
import { llm } from '../lib/llm/llm'
import { krPrompt } from '../lib/prompt/createKeyResult'

export interface KeyResultItem {
  id: number
  title: string
  description: string
}

export interface KeyResultBatch {
  strategy: string
  objective: string
  role: string
  keyResults: KeyResultItem[]
}

@Injectable()
export class CreateKeyResultService {
  // Generate KRs for a single objective
  private async generateKRsForObjective(
    strategy: string,
    objective: string,
    role: string,
    language: string, // new field
  ): Promise<KeyResultItem[]> {
    // Build language-aware prompt
    const prompt = krPrompt(strategy, objective, role, language)
    const messages = [{ role: 'system', content: prompt }]

    // Call LLM
    const response = await llm.call(messages)
    const text = 'text' in response ? response.text : response
    const cleanedText = text.replace(/```json|```/g, '').trim()

    try {
      const parsed = JSON.parse(cleanedText)
      return parsed.keyResults || []
    } catch (err) {
      console.error('Failed to parse Key Results JSON:', cleanedText)
      return []
    }
  }

  // Generate KRs for all objectives in batch
public async generateKRsForObjectives(
  strategy: string,
  objectives: string[],
  role: string,
  language: string
): Promise<KeyResultBatch[]> {
  let idCounter = 1

  const results = await Promise.all(
    objectives.map(async (objective) => {
      const keyResults = await this.generateKRsForObjective(
        strategy,
        objective,
        role,
        language
      )

      keyResults.forEach((kr) => {
        if (!kr.id) {
          kr.id = idCounter++
        } else {
          idCounter = kr.id + 1
        }
      })

      return {
        strategy,
        objective,
        role,
        keyResults,
      }
    })
  )

  return results
}



}
