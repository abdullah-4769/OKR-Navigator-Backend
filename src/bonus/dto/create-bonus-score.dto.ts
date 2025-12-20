export class CreateBonusScoreDto {
  userId: string;
  finalScore: number;
  badge?: 'Gold' | 'Silver' | 'Bronze' | 'None';
  dimensionScores?: {
    objective: number;
    keyResults: number;
    initiatives: number;
    alignment: number;
    relevance: number;
  };
  feedback?: {
    text?: string;
    tone?: 'positive' | 'neutral' | 'corrective';
    tip?: string;
  };
  strengths?: string[];
  improvements?: string[];
}
