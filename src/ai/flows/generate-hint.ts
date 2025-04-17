// TextQuestAI: generate-hint.ts
'use server';
/**
 * @fileOverview A hint generation AI agent.
 *
 * - generateHint - A function that handles the hint generation process.
 * - GenerateHintInput - The input type for the generateHint function.
 * - GenerateHintOutput - The return type for the generateHint function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateHintInputSchema = z.object({
  sceneDescription: z.string().describe('The description of the current scene.'),
  inventory: z.array(z.string()).describe('The list of items in the player\'s inventory.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('A helpful hint for the player to progress in the game.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: {
    schema: z.object({
      sceneDescription: z.string().describe('The description of the current scene.'),
      inventory: z.array(z.string()).describe('The list of items in the player\'s inventory.'),
    }),
  },
  output: {
    schema: z.object({
      hint: z.string().describe('A helpful hint for the player to progress in the game.'),
    }),
  },
  prompt: `You are the TextQuestAI game master, and your job is to help a player who is stuck by giving them a single hint.

  Here is the description of the current scene:
  {{sceneDescription}}

  Here is the player's current inventory:
  {{#if inventory}}
  {{#each inventory}}
  - {{{this}}}
  {{/each}}
  {{else}}
  The player has nothing in their inventory.
  {{/if}}

  Generate a hint that the player can use to progress in the game.  The hint should be actionable, and not give away the solution directly.
  The hint should not refer to the player or their inventory directly.  Instead, refer to the player as "you" or "one".
  The hint should only be a single sentence.
`,
});

const generateHintFlow = ai.defineFlow<
  typeof GenerateHintInputSchema,
  typeof GenerateHintOutputSchema
>(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
