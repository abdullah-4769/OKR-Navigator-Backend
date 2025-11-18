export const okrPrompt = (
  strategy: string,
  role: string,
  industry: string,
  language: string,
) => `
Act as an OKR expert. Create **8 fully unique and high-impact Objectives** that align tightly with:
- Strategy: ${strategy}
- Role: ${role}
- Industry: ${industry}

Strict Rules:
1. Each objective must:
   - Be qualitative, inspiring, and action-driven.
   - Have a **short, unique, and highly varied title** (max 10 words).  
   - Titles must avoid fixed patterns, avoid repeated phrasing, and use different structures each time.
   - Titles must change their style, tone, rhythm, and word order every time.
   - Include a difficulty score from 1 to 5.

2. Every objective must align directly with the strategy: ${strategy}.  
   No generic or vague objectives.

3. Ensure the ${role} can realistically influence the objective within the ${industry} context.

4. No repetition of ideas, themes, or sentence structures across any of the 8 objectives.

5. Do not include examples. Do not reuse formats.  
   Each objective must feel fresh, unpredictable, and naturally different.

6. Write the full output in **${language}**.

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
Please respond only in valid JSON, nothing else.
`
