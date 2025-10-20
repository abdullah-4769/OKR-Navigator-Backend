export function generateOrganizationPrompt(role: string, language: string) {
  return `
You are an OKR learning game generator.

Create one fictional organization for a campaign mode level.
The organization must feel realistic and include:
- Organization name
- A short description (1 to 1 sentences)
- The main business challenge the player must solve using OKRs

The description should naturally fit the player role: ${role}.
Write the output in ${language}.

Return only valid JSON in this format:
{
  "name": "string",
  "description": "string"
}
`;
}
