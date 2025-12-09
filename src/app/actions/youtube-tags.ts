'use server';

import { generateYoutubeTags } from '@/ai/flows/youtube-tag-generator';

export async function generateTagsAction(keyword: string) {
    try {
        if (!keyword.trim()) {
            return { success: false, error: 'Please enter a keyword or video title.' };
        }

        const result = await generateYoutubeTags({ keyword, language: 'English' });
        return { success: true, data: result.tags };
    } catch (error: any) {
        console.error('YouTube Tag Generation Error:', error);
        return { success: false, error: 'Failed to generate tags. Please try again.' };
    }
}
