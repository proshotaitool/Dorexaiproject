
'use server';
/**
 * @fileOverview An AI-powered photo editor that edits images based on text prompts.
 *
 * - editImageWithPrompt - A function that performs the image editing.
 * - AiPhotoEditorInput - The input type for the editImageWithPrompt function.
 * - AiPhotoEditorOutput - The return type for the editImageWithPrompt function.
 */

import { configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

const AiPhotoEditorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('A description of the edits to apply to the photo.'),
  apiKey: z.string().optional().describe('Optional user-provided API key.'),
});
export type AiPhotoEditorInput = z.infer<typeof AiPhotoEditorInputSchema>;

const AiPhotoEditorOutputSchema = z.object({
  editedPhotoDataUri: z
    .string()
    .describe(
      'The edited photo, as a data URI that must include a MIME type and use Base64 encoding.'
    ).optional(),
    error: z.string().optional(),
});
export type AiPhotoEditorOutput = z.infer<typeof AiPhotoEditorOutputSchema>;

export async function editImageWithPrompt(input: AiPhotoEditorInput): Promise<AiPhotoEditorOutput> {
  const generateWithRotation = configureGenkit(input.apiKey);
  
  try {
    const { media } = await generateWithRotation({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `Apply the following edit to the image: "${input.prompt}". Return only the edited image.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
        return { error: 'No media returned from the AI photo editor flow.' };
    }

    return {
      editedPhotoDataUri: media.url,
    };
  } catch (error: any) {
      console.error("AI Photo Editor Error:", error);
      return { error: 'Failed to process image with AI. Please check your API key or try again later.' };
  }
}
