'use server';
/**
 * @fileOverview An AI flow to automatically straighten an image.
 *
 * - straightenImage - A function that suggests a rotation angle to straighten an image.
 * - StraightenImageInput - The input type for the straightenImage function.
 * - StraightenImageOutput - The return type for the straightenImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StraightenImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be straightened, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type StraightenImageInput = z.infer<typeof StraightenImageInputSchema>;

const StraightenImageOutputSchema = z.object({
    angle: z.number().describe('The suggested rotation angle in degrees (-45 to 45) to make the image level. A positive angle means clockwise rotation.'),
});
export type StraightenImageOutput = z.infer<typeof StraightenImageOutputSchema>;


export async function straightenImage(input: StraightenImageInput): Promise<StraightenImageOutput> {
  return straightenImageFlow(input);
}


const prompt = ai.definePrompt({
  name: 'imageStraightenPrompt',
  input: {schema: StraightenImageInputSchema},
  output: {schema: StraightenImageOutputSchema},
  prompt: `You are an expert in photography and image analysis. Analyze the provided image to detect its tilt or skew.

Your task is to determine the angle of rotation needed to make the image perfectly level (e.g., making the horizon horizontal).

Return the required angle in degrees.
- A positive angle signifies a clockwise rotation.
- A negative angle signifies a counter-clockwise rotation.
- The angle should be between -45 and 45 degrees.

For example, if the image is tilted 3.5 degrees to the left, you should return: { "angle": 3.5 }.

Image: {{media url=photoDataUri}}

Return the angle in the structured JSON format.`,
  model: 'googleai/gemini-2.5-flash',
});

const straightenImageFlow = ai.defineFlow(
  {
    name: 'straightenImageFlow',
    inputSchema: StraightenImageInputSchema,
    outputSchema: StraightenImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
