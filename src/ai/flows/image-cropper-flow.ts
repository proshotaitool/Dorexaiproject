
'use server';
/**
 * This flow is deprecated and no longer used. The cropping logic is now handled client-side.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageCropInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the image to be cropped, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageCropInput = z.infer<typeof ImageCropInputSchema>;

const ImageCropOutputSchema = z.object({
    x: z.number().describe('The x-coordinate of the top-left corner of the crop box, as a percentage (0-100) of the image width.'),
    y: z.number().describe('The y-coordinate of the top-left corner of the crop box, as a percentage (0-100) of the image height.'),
    width: z.number().describe('The width of the crop box, as a percentage (0-100) of the image width.'),
    height: z.number().describe('The height of the crop box, as a percentage (0-100) of the image height.'),
});
export type ImageCropOutput = z.infer<typeof ImageCropOutputSchema>;


export async function suggestImageCrop(input: ImageCropInput): Promise<ImageCropOutput> {
  // This is a mock implementation as the AI crop feature has been removed.
  return Promise.resolve({ x: 10, y: 10, width: 80, height: 80 });
}

const suggestImageCropFlow = ai.defineFlow(
  {
    name: 'suggestImageCropFlow',
    inputSchema: ImageCropInputSchema,
    outputSchema: ImageCropOutputSchema,
  },
  async input => {
     // This is a mock implementation as the AI crop feature has been removed.
    return { x: 10, y: 10, width: 80, height: 80 };
  }
);
