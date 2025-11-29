'use server';
/**
 * @fileOverview An AI-powered content generator.
 *
 * - generateContent - A function that generates content based on a prompt.
 * - GenerateContentInput - The input type for the generateContent function.
 * - GenerateContentOutput - The return type for the generateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for content generation.'),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

const GenerateContentOutputSchema = z.object({
  content: z.string().describe('The generated content.'),
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

export async function generateContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  return generateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentPrompt',
  input: {schema: GenerateContentInputSchema},
  output: {schema: GenerateContentOutputSchema},
  prompt: `You are a versatile content creation assistant. Generate high-quality, well-structured content based on the following request:

"{{{prompt}}}"

Format the response professionally. Use headings, subheadings, paragraphs, bullet points, emojis, bold text, and other rich formatting elements to make the content clear, engaging, and easy to read.

Provide only the generated content in your response, directly inside the 'content' field of the JSON output.`,
  model: 'googleai/gemini-2.5-flash',
});

const generateContentFlow = ai.defineFlow(
  {
    name: 'generateContentFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: GenerateContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
