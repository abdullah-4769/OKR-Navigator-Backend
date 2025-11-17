export class CreateBonusScoreDto {
  userId: string;
  overallScore: number;
  normalizedScore: string;
  points: string;
  title: string;
  feedback: string;
  strategyAlignmentTitle: string;
  strategyAlignmentScore: number;
  strategyAlignmentSuggestion: string;
  objectiveAlignmentTitle: string;
  objectiveAlignmentScore: number;
  objectiveAlignmentSuggestion: string;
  keyResultQualityTitle: string;
  keyResultQualityScore: number;
  keyResultQualitySuggestion: string;
}
