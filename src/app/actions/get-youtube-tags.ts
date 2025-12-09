'use server';

import { Innertube, UniversalCache } from 'youtubei.js';

export async function extractYoutubeTags(videoUrl: string) {
    try {
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL' };
        }

        try {
            const youtube = await Innertube.create({
                cache: new UniversalCache(false),
                generate_session_locally: true
            });

            const info = await youtube.getInfo(videoId);

            // The keywords are usually found in basic_info
            const tags = info.basic_info.keywords || [];

            if (tags.length === 0) {
                return { success: false, error: 'No tags found for this video.' };
            }

            return { success: true, data: tags };

        } catch (error: any) {
            console.error('Innertube library error:', error);
            return { success: false, error: 'Failed to fetch video info. The video might be private or restricted.' };
        }

    } catch (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}
