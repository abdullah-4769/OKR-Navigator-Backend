export const dailyTrainingCase = (
  role: string,
  industry: string,
  language: string
) => `
DAILY TRAINING CASE GENERATION: Create a short realistic business case for skill practice.

CRITICAL LANGUAGE RULE:
You must respond ONLY in the language specified below.
Do not use any other language.

CONTEXT:
• Role: "${role}"
• Industry: "${industry}"
• Language: "${language}"

CASE CREATION RULES:

2. VISION:
   • Maximum 12 words
   • Describe what the organization wants to achieve long term

3. STRATEGY:
   • Maximum 15 words
   • Describe the current high level approach

4. PROBLEMS:
   • 2 to 3 short points
   • Each point maximum 10 words
   • Focus on real operational or strategic challenges

IMPORTANT:
• Do not suggest solutions
• Do not mention objectives or key results
• Keep it realistic and business focused

OUTPUT REQUIREMENTS:
• Respond in the specified language only
• Pure JSON only
• Use this structure:
{
  "vision": "",
  "strategy": "",
  "problems": []
}
`
