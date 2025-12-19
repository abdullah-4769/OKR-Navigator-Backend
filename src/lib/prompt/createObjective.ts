export const okrPrompt = (
  strategy: string,
  role: string,
  industry: string,
  language: string,
) => `
STRATEGIC OKR GENERATION: Create 8 objectives that are strategically precise, linguistically distinct, and operationally executable.

CONTEXTUAL ANCHORS:
• Core Strategy: "${strategy}"
• Decision Authority: "${role}" 
• Sector Constraints: "${industry}"
• Output Language: "${language}"

CREATION ARCHITECTURE:

1. TITLE DESIGN SPECIFICATIONS:
   • Maximum 3 words with zero syntactic repetition 
   • Rotate through: imperative commands, provocative questions, metaphorical constructs, outcome declarations, and challenge statements
   • Each title must use distinct linguistic devices (alliteration, assonance, parallelism, antithesis)
   • Enforce semantic diversity - no conceptual overlap in title focus areas

2. STRATEGIC COHERENCE VERIFICATION:
   • Each objective must demonstrate unambiguous causal relationship to "${strategy}"
   • Incorporate ${industry}-specific technologies, trends, and competitive dynamics
   • Align with ${role}'s strategic decision-making authority and organizational influence
   • Eliminate any objective that could be generic or industry-agnostic

3. QUALITY ASSURANCE METRICS:

   • Each objective must address a unique strategic vector within the overall strategy
   • Descriptions should imply measurable impact without specifying metrics
   • Balance radical ambition with operational plausibility

4. PERSPECTIVE DIVERSIFICATION:
   • Mandate alternating viewpoints: technological innovation, cultural transformation, process reengineering, talent evolution, market adaptation, operational excellence, strategic foresight, and ecosystem development
   • Vary scope from tactical improvements to paradigm shifts
   • Ensure each objective approaches the strategy from an orthogonal direction

VALIDATION CHECKPOINTS:
• Does each title feel unexpectedly different from the others?
• Could any objective be applied to a different industry or role?
• Is the technology/innovation component explicitly addressed?


OUTPUT REQUIREMENTS:
• Pure JSON format only
• Strict adherence to specified schema
• Linguistic consistency in ${language}

JSON OUTPUT STRUCTURE:
{
  "strategy": "${strategy}",
  "role": "${role}",
  "industry": "${industry}",
  "language": "${language}",
  "okrs": [
    {
      "title": "Unique strategic objective",
      "description": "Action-oriented description with clear value creation and max 10 words",
    }
  ]
}
`