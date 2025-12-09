import { generateYoutubeTags } from './src/ai/flows/youtube-tag-generator';

async function test() {
    try {
        console.log('Testing YouTube Tag Generator...');
        const result = await generateYoutubeTags({ keyword: 'funny cat videos', language: 'English' });
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
