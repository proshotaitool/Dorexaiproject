
'use server';

/**
 * @fileOverview An AI-powered background remover flow.
 *
 * - removeBackground - A function that removes the background from an image.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import { configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

const RemoveBackgroundInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo to remove the background from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // prettier-ignore
    ),
  apiKey: z.string().optional().describe('Optional user-provided API key.'),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  processedPhotoDataUri: z
    .string()
    .describe(
      'A photo with the background removed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // prettier-ignore
    ).optional(),
    error: z.string().optional(),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  const generateWithRotation = configureGenkit(input.apiKey);

  try {
    const { media } = await generateWithRotation({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: 'remove the background from the photo'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      return { error: 'No media returned from background removal.' };
    }

    return {
      processedPhotoDataUri: media.url,
    };
  } catch (error: any) {
    console.error("AI Background Removal Error:", error);
    return { error: 'Failed to process image with AI. Please check your API key or try again later.' };
  }
}
