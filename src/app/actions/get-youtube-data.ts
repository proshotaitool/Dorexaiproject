'use server';

import { Innertube, UniversalCache } from 'youtubei.js';

export interface YoutubeData {
    // Video Info
    title: string;
    videoId: string;
    description: string;
    publishDate: string;
    category: string;
    isFamilySafe: boolean;
    isMonetized: boolean; // Inferred
    duration: number; // seconds

    // Stats
    viewCount: string;
    likeCount: string;
    dislikeCount: string | null; // Often hidden
    commentCount: string;

    // Tags
    tags: string[];

    // Thumbnails
    thumbnails: { url: string; width: number; height: number }[];

    // Channel Info
    channelTitle: string;
    channelId: string;
    channelLogo: string;
    channelBanner: string;
    channelTags: string[];
}

export async function getYoutubeData(videoUrl: string) {
    console.log('getYoutubeData called with:', videoUrl);
    try {
        const videoId = extractVideoId(videoUrl);
        console.log('Extracted Video ID:', videoId);
        if (!videoId) {
            return { success: false, error: 'Invalid YouTube URL' };
        }

        try {
            console.log('Initializing Innertube...');
            const youtube = await Innertube.create({
                cache: new UniversalCache(false),
                generate_session_locally: true
            });

            console.log('Fetching video info for:', videoId);
            const info = await youtube.getInfo(videoId);
            console.log('Video info fetched successfully');

            const basicInfo = info.basic_info;
            const primaryInfo = info.primary_info;

            console.log('Basic Info:', basicInfo ? 'Found' : 'Missing');
            console.log('Primary Info:', primaryInfo ? 'Found' : 'Missing');

            // Extract Channel ID to fetch more channel details
            const channelId = basicInfo.channel_id;
            let channelBanner = '';
            let channelTags: string[] = [];
            let channelLogo = '';

            if (channelId) {
                try {
                    console.log('Fetching channel info for:', channelId);
                    const channel = await youtube.getChannel(channelId);
                    // Try to get banner
                    const header = channel.header;
                    if (header && 'banner' in header && Array.isArray(header.banner) && header.banner.length > 0) {
                        channelBanner = header.banner[0].url;
                    }
                    // Try to get avatar/logo from channel info if not available in video info
                    if (header && 'author' in header && 'thumbnails' in header.author && Array.isArray(header.author.thumbnails) && header.author.thumbnails.length > 0) {
                        channelLogo = header.author.thumbnails[0].url;
                    }

                    // Channel keywords are not always directly exposed in the initial channel object easily without parsing metadata
                    // We will try to look for metadata
                    if (channel.metadata && 'keywords' in channel.metadata) {
                        // @ts-ignore
                        const keywords = channel.metadata.keywords;
                        if (Array.isArray(keywords)) {
                            channelTags = keywords.map((k: any) => k.toString());
                        }
                    }

                } catch (err) {
                    console.warn('Failed to fetch channel details:', err);
                }
            }

            // Fallback for channel logo from video info if fetch failed or empty
            if (!channelLogo && primaryInfo?.menu?.top_level_buttons) {
                // Sometimes logo is in the menu or owner info, but basic_info doesn't have it.
                // We might have to rely on what we got or a placeholder.
            }

            // Inferred Monetization: Check if ads are enabled or present
            // This is a heuristic. `info.player_response.adPlacements` exists if ads are served.
            // @ts-ignore
            const isMonetized = !!info.player_response?.adPlacements?.length || !!info.player_response?.playerConfig?.daiConfig;


            const data: YoutubeData = {
                title: basicInfo.title || '',
                videoId: basicInfo.id || '',
                description: basicInfo.short_description || '',
                publishDate: (primaryInfo as any)?.date?.text || (primaryInfo as any)?.published?.text || '',
                category: basicInfo.category || 'Unknown',
                isFamilySafe: basicInfo.is_family_safe || false,
                isMonetized,
                duration: basicInfo.duration || 0,

                viewCount: basicInfo.view_count?.toString() || '0',
                likeCount: basicInfo.like_count?.toString() || '0',
                dislikeCount: null, // YouTube API doesn't provide this publicly anymore
                commentCount: 'Unknown', // Requires separate fetch usually, or sometimes in secondary info

                tags: basicInfo.keywords ? basicInfo.keywords.map((k: any) => k.toString()) : [],
                thumbnails: basicInfo.thumbnail ? basicInfo.thumbnail.map((t: any) => ({
                    url: t.url,
                    width: t.width,
                    height: t.height
                })) : [],

                channelTitle: basicInfo.channel?.name || '',
                channelId: basicInfo.channel_id || '',
                channelLogo: channelLogo,
                channelBanner: channelBanner,
                channelTags: channelTags
            };

            return { success: true, data };

        } catch (error: any) {
            console.error('Innertube library error:', error);
            return { success: false, error: 'Failed to fetch video info. The video might be private or restricted.' };
        }

    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}
