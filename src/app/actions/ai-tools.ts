'use server';

import { humanizeTextFlow } from '@/ai/flows/ai-humanizer';
import { plagiarismCheckerFlow } from '@/ai/flows/plagiarism-checker';

export async function humanizeTextAction(text: string) {
    try {
        const result = await humanizeTextFlow({ text });
        return { success: true, data: result };
    } catch (error) {
        console.error('Humanize Text Error:', error);
        return { success: false, error: 'Failed to humanize text' };
    }
}

export async function checkPlagiarismAction(text: string) {
    try {
        const result = await plagiarismCheckerFlow({ text });
        return { success: true, data: result };
    } catch (error) {
        console.error('Plagiarism Check Error:', error);
        return { success: false, error: 'Failed to check plagiarism' };
    }
}
