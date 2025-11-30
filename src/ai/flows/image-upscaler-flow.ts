
'use server';
/**
 * @fileOverview An AI flow to upscale image resolution.
 *
 * - upscaleImage - A function that increases image resolution.
 * - UpscaleImageInput - The input type for the upscaleImage function.
 * - UpscaleImageOutput - The return type for the upscaleImage function.
 */

import { configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

const UpscaleImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to upscale, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  scale: z.number().describe('The factor by which to upscale the image (e.g., 2 or 4).'),
  apiKey: z.string().optional().describe('Optional user-provided API key.'),
});
export type UpscaleImageInput = z.infer<typeof UpscaleImageInputSchema>;

const UpscaleImageOutputSchema = z.object({
  processedPhotoDataUri: z
    .string()
    .describe(
      'The upscaled photo, as a data URI that must include a MIME type and use Base64 encoding.'
    ).optional(),
  error: z.string().optional(),
});
export type UpscaleImageOutput = z.infer<typeof UpscaleImageOutputSchema>;

export async function upscaleImage(input: UpscaleImageInput): Promise<UpscaleImageOutput> {
  const generateWithRotation = configureGenkit(input.apiKey);

  try {
    const { media } = await generateWithRotation({
      model: 'googleai/imagen-3.0-generate-002',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `Upscale this image to ${input.scale}x its original resolution. Enhance details and improve clarity without adding artifacts.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    if (!media) {
      return { error: 'No media returned from image upscaling flow.' };
    }

    return {
      processedPhotoDataUri: media.url,
    };
  } catch (error: any) {
    console.error("AI Upscaling Error:", error);
    return { error: 'Failed to process image with AI. Please check your API key or try again later.' };
  }
}
