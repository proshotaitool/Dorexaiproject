import { ai, configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

export const HumanizeTextInput = z.object({
    text: z.string(),
});

export const HumanizeTextOutput = z.object({
    humanizedText: z.string(),
});

export const humanizeTextFlow = ai.defineFlow(
    {
        name: 'humanizeText',
        inputSchema: HumanizeTextInput,
        outputSchema: HumanizeTextOutput,
    },
    async (input) => {
        const { text } = input;
        const prompt = `Rewrite the following text to make it sound more natural, human-like, variable in sentence structure, and less robotic. Maintain the original meaning. Do not add any introductory or concluding remarks, just return the rewritten text.

Text:
${text}`;

        const generate = configureGenkit();
        const { text: humanizedText } = await generate({
            prompt,
            model: 'googleai/gemini-1.5-flash',
        });

        return { humanizedText };
    }
);

export async function humanizeText(input: z.infer<typeof HumanizeTextInput>): Promise<z.infer<typeof HumanizeTextOutput>> {
    return humanizeTextFlow(input);
}
