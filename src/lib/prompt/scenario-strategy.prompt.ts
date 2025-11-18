// lib/prompt/scenario-strategy.prompt.ts
export function generateScenarioPrompt(sector: string, role: string, language: string = 'en'): string {
  return `
   You are an expert OKR evaluation assistant.
You are a OKR strategy simulation engine. Your task is to generate a certification challenge for a serious game about OKRs.

Player Context:
- Sector: ${sector}
- Role: ${role}
- Language: ${language}

Instructions:
1. Generate a concise, realistic business scenario for a company in the ${sector} sector, presenting a core strategic challenge that the ${role} would be responsible for addressing.
2. Generate four strategic options for this scenario. Each strategy must have:
   - "title": a short descriptive title for the strategy
   - "text": the detailed explanation of the strategy
   Only one strategy should be the most relevant, direct, and effective response to the challenge. The other three should be plausible but flawed in some way.
3. Write the scenario and strategies fully in the requested language.

IMPORTANT: Only return valid JSON. Do not include explanations or extra text.

Output Format (strict JSON only):
{
  "scenario": "...",
  "strategies": [
    { "id": 1, "title": "...", "text": "..." },
    { "id": 2, "title": "...", "text": "..." },
    { "id": 3, "title": "...", "text": "..." },
    { "id": 4, "title": "...", "text": "..." }
  ],
  "correct_strategy_id": 1
}`;
}
