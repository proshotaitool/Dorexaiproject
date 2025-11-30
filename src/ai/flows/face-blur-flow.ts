
'use server';
/**
 * @fileOverview An AI flow to detect and blur human faces in an image.
 *
 * - blurFaces - A function that returns a new image with faces blurred.
 * - BlurFacesInput - The input type for the blurFaces function.
 * - BlurFacesOutput - The return type for the blurFaces function.
 */

import { configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

const BlurFacesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to detect and blur faces in, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  blurMode: z.enum(['blur', 'pixelate']).describe("The style of blur to apply."),
  intensity: z.number().min(0).max(100).describe("The intensity of the blur effect, from 0 to 100."),
  apiKey: z.string().optional().describe('Optional user-provided API key.'),
});
export type BlurFacesInput = z.infer<typeof BlurFacesInputSchema>;

const BlurFacesOutputSchema = z.object({
  processedPhotoDataUri: z
    .string()
    .describe(
      'The processed photo with faces blurred, as a data URI that must include a MIME type and use Base64 encoding.'
    ).optional(),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type BlurFacesOutput = z.infer<typeof BlurFacesOutputSchema>;

export async function blurFaces(input: BlurFacesInput): Promise<BlurFacesOutput> {
  const generateWithRotation = configureGenkit(input.apiKey);
  const mimeType = input.photoDataUri.match(/data:(image\/[^;]+);/)?.[1] || 'image/jpeg';

  try {
    const { media } = await generateWithRotation({
      model: 'googleai/imagen-3.0-generate-002',
      prompt: [
        { media: { url: input.photoDataUri, contentType: mimeType } },
        {
          text: `Your task is to identify all human faces in the provided image and apply a visual effect to obscure them for privacy.

        1.  **Detect all human faces** in the image.
        2.  Apply a **'${input.blurMode}'** effect to each detected face.
        3.  The intensity of the effect should be approximately **${input.intensity}%**.
        4.  Return only the fully processed image with the faces obscured. Do not return the original image or any text.
        `},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      return { error: 'No media returned from the face blurring flow.' };
    }

    return {
      processedPhotoDataUri: media.url,
    };
  } catch (error: any) {
    console.error("AI Face Blurring Error:", error);
    return { error: 'Failed to process image with AI. Please check your API key or try again later.' };
  }
}
