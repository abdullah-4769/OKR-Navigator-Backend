export const krPrompt = (
  strategy: string,
  objective: string,
  role: string,
  language: string,
) => `
Generate exactly 3 Key Results for the Objective below.

Rules:
1. Each Key Result must include:
   - "id": a number from 1 to 12, in order
   - "title": maximum 6 words, clear, action-focused, and unique each time
   - "description": 1–2 natural sentences with measurable values, written fresh each time

2. All measurable values must be fully dynamic:
   - Use numbers, percentages, or dates that are unique in each Key Result
   - Do not repeat any number, percentage, or date inside the 3 Key Results
   - Do not use common or predictable values
   - Generate varied, natural metrics without patterns or repetition

3. All Key Results must directly support:
   "${objective}"

4. Align every Key Result with:
   "${strategy}"

5. Consider this role while writing:
   "${role}"

6. Write the response fully in **${language}**.

Return ONLY valid JSON in this structure, but generate new titles and descriptions:
{
  "strategy": "${strategy}",
  "objective": "${objective}",
  "role": "${role}",
  "language": "${language}",
  "keyResults": [
    {
      "id": 1,
      "title": "DYNAMIC TITLE",
      "description": "DYNAMIC measurable description with unique values"
    },
    {
      "id": 2,
      "title": "DYNAMIC TITLE",
      "description": "DYNAMIC measurable description with unique values"
    },
    {
      "id": 3,
      "title": "DYNAMIC TITLE",
      "description": "DYNAMIC measurable description with unique values"
    }
  ]
}
`;
