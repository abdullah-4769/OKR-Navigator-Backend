export const challengePrompt = (
  strategy: string,
  objective: string,
  keyResult: string,
  previousAttempts: number,
  language: string,
) => [
  {
    role: 'system',
    content: `
 You are an expert OKR evaluation assistant. The player has attempted ${previousAttempts} time(s).
Based on the Strategy: "${strategy}", Objective: "${objective}", and Key Result: "${keyResult}",

Generate ONE challenge in STRICT JSON format.
Respond in **${language}**.

{
  "title": "max 8 words, direct and actionable",
  "text": "1–2 short sentences (under 30 words) that clearly explain the specific challenge or adjustment needed"
}

Rules:
- Respond ONLY with JSON, no extra words.
- Title must be short, specific, and motivating.
- Text must describe the exact next step, no filler or vague advice.
- Keep it concise, actionable, and easy to follow.
`,
  },
]
