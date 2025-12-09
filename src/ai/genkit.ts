
import { genkit, type GenerateOptions } from 'genkit';
import { openAI } from 'genkitx-openai';
import { googleAI } from '@genkit-ai/google-genai';
import { getApiKey, rotateApiKey, resetApiKeyIndex, getApiKeyCount } from './api-key-manager';

export const ai = genkit({
    plugins: [googleAI(), openAI({ apiKey: process.env.OPENAI_API_KEY })],
});

// This function now returns another function that handles the generation with rotation.
export function configureGenkit(userApiKey?: string) {
    // This is the function that will be called by the flows.
    return async function generateWithRotation(options: GenerateOptions): Promise<{ media: any; text: any; output?: any }> {
        let attempts = 0;
        const maxAttempts = getApiKeyCount();

        resetApiKeyIndex(); // Reset to the first key for each new request.

        while (attempts < maxAttempts) {
            try {
                const currentApiKey = userApiKey || getApiKey();
                if (!currentApiKey) {
                    throw new Error('No API key available.');
                }

                const localAI = genkit({
                    plugins: [googleAI({ apiKey: currentApiKey })],
                });

                // Perform the actual generation call
                const result = await localAI.generate(options);
                return { media: result.media, text: result.text, output: result.output };

            } catch (error: any) {
                console.error(`Attempt ${attempts + 1} failed:`, error.message);
                if (error.message.includes('Quota') || error.message.includes('429')) {
                    if (userApiKey) { // If user's key fails, don't rotate, just throw.
                        throw new Error('Your provided API key has exceeded its quota.');
                    }
                    const rotated = rotateApiKey();
                    if (rotated) {
                        attempts++;
                        continue; // Retry with the new key
                    }
                }
                // For non-quota errors or if rotation fails, throw the error
                throw error;
            }
        }

        // If all attempts failed
        throw new Error('All API keys have exceeded their quotas. Please try again later.');
    };
}
