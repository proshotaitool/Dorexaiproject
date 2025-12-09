'use server';

import { Innertube, UniversalCache } from 'youtubei.js';

interface TranscriptItem {
    text: string;
    start: number;
    duration: number;
}

export async function getYoutubeTranscript(videoUrl: string) {
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
            const transcriptData = await info.getTranscript();

            if (!transcriptData || !transcriptData.transcript) {
                return { success: false, error: 'No transcript found for this video.' };
            }

            // Map to our format
            const transcript: TranscriptItem[] = transcriptData.transcript.content?.body?.initial_segments.map((segment: any) => ({
                text: segment.snippet.text,
                start: Number(segment.start_ms) / 1000,
                duration: Number(segment.end_ms - segment.start_ms) / 1000
            })) || [];

            if (transcript.length === 0) {
                return { success: false, error: 'Transcript is empty.' };
            }

            return { success: true, data: transcript };

        } catch (error: any) {
            console.error('Innertube library error:', error);
            return { success: false, error: 'Failed to fetch transcript. The video might not have captions or is restricted.' };
        }

    } catch (error) {
        console.error('Error fetching transcript:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}
