export const okrPrompt = (
  strategy: string,
  role: string,
  industry: string,
  language: string,
) => `
Act as an OKR expert. Generate **8 unique and inspiring Objectives** aligned to:
- Strategy: ${strategy}
- Role: ${role}
- Industry: ${industry}

Rules:
1. Each objective must be:
   - **Qualitative, action-oriented, ambitious, and inspiring.**
   - Include a short **title** (max 10 words). Each title must be **completely unique** within this response and not repeat past titles.
   - Include a **description** that is actionable, measurable, and **varied** in wording and approach. Avoid repeating phrases like "increase by 20%" or "user experience" unless it naturally fits differently.
   - Include a **difficulty** rating between 1 and 5 (1 = easy, 5 = very hard).
2. Ensure strict alignment with the strategy: ${strategy}.
3. Focus on objectives the ${role} can directly influence in the ${industry}.
4. Avoid repeating similar objectives. Make each objective and description **distinct and fresh**.
5. Use a **different example or approach** for each objective. Introduce creative actions and outcomes.
6. Write the response in **${language}**.

Output Format (JSON ONLY):
{
  "strategy": "${strategy}",
  "role": "${role}",
  "industry": "${industry}",
  "language": "${language}",
  "okrs": [
    {
      "title": "Objective title",
      "description": "Objective description",
      "difficulty": 1
    }
  ]
}
Please respond only in valid JSON, no extra text.
`
