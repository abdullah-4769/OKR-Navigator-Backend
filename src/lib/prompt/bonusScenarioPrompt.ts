export const bonusScenario = (
  role: string,
  industry: string,
  language: string,
) => `
BONUS SCENARIO GENERATION: Create a strategic scenario for a serious game player.

CONTEXT:
• Decision Role: "${role}"
• Industry Sector: "${industry}"
• Output Language: "${language}"

SCENARIO CREATION RULES:
1. TITLE:
   • Maximum 6 words
   • Clear, engaging, relevant to role/industry
2. DESCRIPTION:
   • Maximum 15 words
   • Describe organizational context, main challenge, and constraints
   • Must be realistic and business-focused
3. STRATEGIC RELEVANCE:
   • Scenario must allow OKR analysis
   • Avoid suggesting objectives, key results, or solutions

OUTPUT REQUIREMENTS:
• Pure JSON format only
• Use the following structure:
{
  "title": "Scenario title",
  "description": "Brief context and strategic challenge"
}
`
