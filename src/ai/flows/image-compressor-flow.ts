
'use server';
/**
 * @fileOverview An AI flow to suggest optimal image compression quality.
 *
 * - suggestImageQuality - A function that suggests a quality setting for an image.
 * - ImageQualityInput - The input type for the suggestImageQuality function.
 * - ImageQualityOutput - The return type for the suggestImageQuality function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageQualityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the image to be compressed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageQualityInput = z.infer<typeof ImageQualityInputSchema>;

const ImageQualityOutputSchema = z.object({
  quality: z.number().describe('The suggested quality setting (0-100) for the image to balance size and visual fidelity.'),
});
export type ImageQualityOutput = z.infer<typeof ImageQualityOutputSchema>;


export async function suggestImageQuality(input: ImageQualityInput): Promise<ImageQualityOutput> {
  return suggestImageQualityFlow(input);
}


const prompt = ai.definePrompt({
  name: 'imageQualityPrompt',
  input: { schema: ImageQualityInputSchema },
  output: { schema: ImageQualityOutputSchema },
  prompt: `You are an expert image compression analyst. Based on the provided image, suggest an optimal quality setting (a number between 0 and 100) for JPEG or WEBP compression.

Your goal is to find the best balance between file size reduction and perceptual quality.

- For detailed photos with many colors and gradients, suggest a higher quality (e.g., 80-95).
- For simple graphics, logos, or images with large areas of flat color, you can suggest a lower quality (e.g., 65-80) to maximize file size savings.
- For images with text, ensure the quality is high enough to keep the text sharp and readable (e.g., 85+).

Analyze the image content and return only the suggested quality number.

Image: {{media url=photoDataUri}}

Return the suggestion in the structured JSON format.`,
  model: 'googleai/gemini-1.5-flash',
});

const suggestImageQualityFlow = ai.defineFlow(
  {
    name: 'suggestImageQualityFlow',
    inputSchema: ImageQualityInputSchema,
    outputSchema: ImageQualityOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
