import { ai, configureGenkit } from '@/ai/genkit';
import { z } from 'genkit';

export const PlagiarismCheckerInput = z.object({
    text: z.string(),
});

export const PlagiarismCheckerOutput = z.object({
    score: z.number().describe('Originality score from 0 to 100, where 100 is highly original'),
    analysis: z.string().describe('Brief analysis of the text originality'),
});

export const plagiarismCheckerFlow = ai.defineFlow(
    {
        name: 'plagiarismChecker',
        inputSchema: PlagiarismCheckerInput,
        outputSchema: PlagiarismCheckerOutput,
    },
    async (input) => {
        const { text } = input;
        const prompt = `Analyze the following text for originality. Check for generic phrasing, excessive repetition, common AI patterns, and robotic structure. 
    
    Provide an 'Originality Score' from 0 to 100:
    - 0-40: Likely AI-generated or highly generic.
    - 41-70: Mixed or somewhat generic.
    - 71-100: Likely human-written and original.

    Also provide a brief analysis (2-3 sentences) explaining why you gave this score.

    Text:
    ${text}`;

        const generate = configureGenkit();
        const { output } = await generate({
            prompt,
            model: 'googleai/gemini-1.5-flash',
            output: { schema: PlagiarismCheckerOutput },
        });

        if (!output) {
            throw new Error('Failed to generate plagiarism analysis');
        }

        return output;
    }
);

export async function checkPlagiarism(input: z.infer<typeof PlagiarismCheckerInput>): Promise<z.infer<typeof PlagiarismCheckerOutput>> {
    return plagiarismCheckerFlow(input);
}
