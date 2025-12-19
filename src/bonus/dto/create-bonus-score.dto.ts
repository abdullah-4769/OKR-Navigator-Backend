export class CreateBonusScoreDto {
  userId: string;
  overallScore: number;
  status: 'Accepted' | 'Partially Relevant' | 'Rejected';
  feedbackText: string;
  feedbackTone: 'positive' | 'neutral' | 'corrective';
  feedbackTip: string;
  strengths: string[]; 
  improvements: string[];
  badge: 'Gold' | 'Silver' | 'Bronze' | 'None';
  title: string;
  scenarioDescription: string;
}
