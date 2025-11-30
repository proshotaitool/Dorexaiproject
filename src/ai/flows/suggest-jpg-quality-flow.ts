
'use server';
/**
 * @fileOverview An AI flow to suggest optimal JPG compression quality.
 *
 * - suggestJpgQuality - A function that suggests a quality setting for an image.
 * - ImageQualityInput - The input type for the suggestJpgQuality function.
 * - ImageQualityOutput - The return type for the suggestJpgQuality function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageQualityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the image to be converted, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageQualityInput = z.infer<typeof ImageQualityInputSchema>;

const ImageQualityOutputSchema = z.object({
  quality: z.number().describe('The suggested quality setting (0-100) for the JPG to balance size and visual fidelity.'),
});
export type ImageQualityOutput = z.infer<typeof ImageQualityOutputSchema>;


export async function suggestJpgQuality(input: ImageQualityInput): Promise<ImageQualityOutput> {
  return suggestJpgQualityFlow(input);
}


const prompt = ai.definePrompt({
  name: 'jpgQualityPrompt',
  input: { schema: ImageQualityInputSchema },
  output: { schema: ImageQualityOutputSchema },
  prompt: `You are an expert image compression analyst. Based on the provided image, suggest an optimal quality setting (a number between 0 and 100) for JPG compression.

Your goal is to find the best balance between file size reduction and perceptual quality.

- For detailed photos with many colors and gradients, suggest a higher quality (e.g., 80-95).
- For simple graphics, logos, or images with large areas of flat color, you can suggest a lower quality (e.g., 65-80) to maximize file size savings.
- For images with text, ensure the quality is high enough to keep the text sharp and readable (e.g., 85+).
- If the original image is a PNG with transparency, assume it will be placed on a white background and focus on the subject's quality.

Analyze the image content and return only the suggested quality number.

Image: {{media url=photoDataUri}}

Return the suggestion in the structured JSON format.`,
  model: 'googleai/gemini-1.5-flash',
});

const suggestJpgQualityFlow = ai.defineFlow(
  {
    name: 'suggestJpgQualityFlow',
    inputSchema: ImageQualityInputSchema,
    outputSchema: ImageQualityOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
