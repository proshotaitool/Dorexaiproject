'use server';
/**
 * @fileOverview An AI flow to detect human faces in an image and return their bounding boxes.
 *
 * - detectFaces - A function that returns bounding boxes for detected faces.
 * - DetectFacesInput - The input type for the detectFaces function.
 * - DetectFacesOutput - The return type for the detectFaces function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectFacesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to detect faces in, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectFacesInput = z.infer<typeof DetectFacesInputSchema>;

const DetectFacesOutputSchema = z.object({
  faces: z.array(
    z.object({
      x: z.number().describe('The x-coordinate of the top-left corner of the bounding box, as a percentage of the image width.'),
      y: z.number().describe('The y-coordinate of the top-left corner of the bounding box, as a percentage of the image height.'),
      width: z.number().describe('The width of the bounding box, as a percentage of the image width.'),
      height: z.number().describe('The height of the bounding box, as a percentage of the image height.'),
    })
  ).describe('An array of detected face bounding boxes.'),
});
export type DetectFacesOutput = z.infer<typeof DetectFacesOutputSchema>;


export async function detectFaces(input: DetectFacesInput): Promise<DetectFacesOutput> {
  return detectFacesFlow(input);
}


const prompt = ai.definePrompt({
  name: 'detectFacesPrompt',
  input: { schema: DetectFacesInputSchema },
  output: { schema: DetectFacesOutputSchema },
  prompt: `Analyze the provided image and identify all human faces.

Return a bounding box for each detected face. Each bounding box should be defined by the top-left corner (x, y) and its dimensions (width, height). All values must be percentages of the total image dimensions (0-100).

If no faces are found, return an empty array.

Image: {{media url=photoDataUri}}

Return the bounding boxes in the structured JSON format.`,
  model: 'googleai/gemini-1.5-flash',
});

const detectFacesFlow = ai.defineFlow(
  {
    name: 'detectFacesFlow',
    inputSchema: DetectFacesInputSchema,
    outputSchema: DetectFacesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
