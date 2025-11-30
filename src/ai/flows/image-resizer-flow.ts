
'use server';
/**
 * @fileOverview An AI flow to suggest optimal image dimensions.
 *
 * - suggestImageDimensions - A function that suggests dimensions for common use cases.
 * - ImageResizerInput - The input type for the suggestImageDimensions function.
 * - ImageResizerOutput - The return type for the suggestImageDimensions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageResizerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the image to be resized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageResizerInput = z.infer<typeof ImageResizerInputSchema>;

const ImageResizerOutputSchema = z.object({
  suggestions: z.array(z.object({
    name: z.string().describe('The name of the use case, e.g., "Instagram Post" or "Website Hero".'),
    width: z.number().describe('The suggested width in pixels.'),
    height: z.number().describe('The suggested height in pixels.'),
  })).describe('An array of suggested dimensions for the image.'),
});
export type ImageResizerOutput = z.infer<typeof ImageResizerOutputSchema>;


export async function suggestImageDimensions(input: ImageResizerInput): Promise<ImageResizerOutput> {
  return suggestImageDimensionsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'imageResizerPrompt',
  input: { schema: ImageResizerInputSchema },
  output: { schema: ImageResizerOutputSchema },
  prompt: `You are an expert graphic designer and social media manager. Based on the provided image, suggest 4-6 optimal dimensions for common use cases.

Prioritize common social media platforms and standard web image sizes. For example: Instagram Post, Instagram Story, Facebook Post, Twitter Post, Website Hero, Blog Thumbnail.

Analyze the image content and aspect ratio to provide smart recommendations. For example, a wide image is better for a website hero, while a portrait-oriented one is better for a story.

Image: {{media url=photoDataUri}}

Return the suggestions in a structured JSON format.`,
  model: 'googleai/imagen-3.0-generate-002',
});

const suggestImageDimensionsFlow = ai.defineFlow(
  {
    name: 'suggestImageDimensionsFlow',
    inputSchema: ImageResizerInputSchema,
    outputSchema: ImageResizerOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
