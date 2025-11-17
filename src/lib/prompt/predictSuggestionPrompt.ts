export const predictSuggestionPrompt = (
  strategy: string,
  role: string,
  industry: string,
  objective: string,
  keyResults: string,
  language: string
) => `
Act as an OKR advisor for the OKR'Nav game. 
Analyze the input below for **Strategic Alignment**, **Objective Alignment**, and **Key Result Quality**.

**Strategy**: ${strategy}  
**Role**: ${role}  
**Industry**: ${industry}  
**Objective**: "${objective}"  
**Key Results**: "${keyResults}"  
**Language**: ${language}

### Suggestion Guidelines
- First, give an **overall score out of 100** for the input
- Also provide a **normalized score out of 30** based on weighting
  - Strategy (30%), Objective (30%), Key Results (40%)
  - Example: if overallScore = 75, normalizedScore = 22.5/30
- Provide a **top-level title** based on overallScore: 
  - 90–100 → "Perfect"
  - 70–89 → "Good"
  - Below 70 → "Needs Work"
- Provide a **title for each part**: Perfect, Good, or Needs Work
- Provide a **score for each part**: strategy out of 30, objective out of 30, key results out of 40
- Split **key results by comma** and evaluate each individually
- **Start evaluation of each key result clearly** with "Key Result [number]:"
- Give **1 point per key result** if it is specific, measurable, and time-bound
- Sum points to **3/3**, even if fewer key results are listed, but mention in suggestion that more key results can improve coverage
- Provide a **suggestion text** explaining strengths or improvements
- Always give the best response with high accuracy and relevance
- Write the response in **${language}**

### Output Format
\`\`\`json
{
  "overallScore": 0,
  "normalizedScore": "0/30",
  "points": "0/3",
  "title": "[Perfect, Good, Needs Work based on overallScore]",
  "feedback": "Overall suggestion text in 10-15 words",
  "breakdown": {
    "strategyAlignment": {
      "title": "[Perfect, Good, Needs Work]",
      "score": 0,
      "suggestion": "[Text suggestion and text in 10-15 words]"
    },
    "objectiveAlignment": {
      "title": "[Perfect, Good, Needs Work]",
      "score": 0,
      "suggestion": "[Text suggestion ]"
    },
    "keyResultQuality": {
      "title": "[Perfect, Good, Needs Work]",
      "score": 0,
      "suggestion": "[Text suggestion including if more key results are recommended and text in 10-15 words]"
    }
  }
}
\`\`\`
`;
