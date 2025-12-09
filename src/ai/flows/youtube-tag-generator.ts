

import { ai, configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateTagsInputSchema = z.object({
    keyword: z.string().describe('The video title or main keyword.'),
    language: z.string().optional().default('English').describe('The language for the tags.'),
});
export type GenerateTagsInput = z.infer<typeof GenerateTagsInputSchema>;

export const GenerateTagsOutputSchema = z.object({
    tags: z.array(z.string()).describe('A list of optimized YouTube tags.'),
});
export type GenerateTagsOutput = z.infer<typeof GenerateTagsOutputSchema>;

export async function generateYoutubeTags(input: GenerateTagsInput): Promise<GenerateTagsOutput> {
    return generateTagsFlow(input);
}

const generateTagsFlow = ai.defineFlow(
    {
        name: 'generateYoutubeTagsFlow',
        inputSchema: GenerateTagsInputSchema,
        outputSchema: GenerateTagsOutputSchema,
    },
    async (input) => {
        const generate = configureGenkit();
        const prompt = `Generate a list of 15-20 high-volume, relevant, and optimized YouTube tags for a video about: "${input.keyword}".
    
    Language: ${input.language}
    
    Return ONLY the tags as a JSON array of strings. Do not include any other text or explanations.`;

        const { output } = await generate({
            prompt,
            model: 'googleai/gemini-1.5-flash',
            output: { schema: GenerateTagsOutputSchema },
        });

        if (!output) {
            throw new Error('Failed to generate tags.');
        }

        return output;
    }
);
