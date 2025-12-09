import 'dotenv/config';
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

async function main() {
    const key = process.env.OPENAI_API_KEY;
    console.log('OPENAI_API_KEY present:', !!key);
    if (key) {
        console.log('Key starts with:', key.substring(0, 3) + '...');
    } else {
        console.error('OPENAI_API_KEY is missing!');
        return;
    }

    try {
        const ai = genkit({
            plugins: [openAI({ apiKey: key })],
        });
        const { text } = await ai.generate({
            model: 'openai/gpt-4o',
            prompt: 'Say hello',
        });
        console.log('Generation success:', text);
    } catch (error: any) {
        console.error('Generation failed:', error.message);
    }
}

main();
