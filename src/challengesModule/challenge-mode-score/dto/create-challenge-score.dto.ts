// src/challenge-mode-score/dto/create-challenge-score.dto.ts
import { IsInt, IsOptional, IsString, IsObject } from 'class-validator'

export class CreateChallengeScoreDto {
  @IsString()
  userId: string

  @IsInt()
  challengeId: number

  @IsInt()
  score: number

  @IsOptional()
  @IsString()
  title?: string

  @IsInt()
  alignmentStrategy: number

  @IsInt()
  objectiveClarity: number

  @IsInt()
  keyResultQuality: number

  @IsInt()
  initiativeRelevance: number

  @IsInt()
  challengeAdoption: number

  @IsOptional()
  @IsString()
  time?: string

  @IsObject()
  strategyAlignment: Record<string, any>

  @IsObject()
  objectiveAlignment: Record<string, any>

  @IsObject()
  keyResultQualityLog: Record<string, any>
}
