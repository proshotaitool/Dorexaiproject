'use server';

import { Innertube, UniversalCache } from 'youtubei.js';

export interface MonetizationResult {
    success: boolean;
    isMonetized?: boolean;
    reason?: string;
    channelDetails?: {
        title: string;
        avatarUrl: string;
        bannerUrl: string;
        subscriberCount: string;
        viewCount: string;
        videoCount: string;
        channelUrl: string;
        joinedDate: string;
    };
    error?: string;
}

export async function checkMonetization(input: string): Promise<MonetizationResult> {
    console.log('checkMonetization called with:', input);
    try {
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        let channelId = '';
        let videoId = '';

        // 1. Try to extract from Video URL
        const extractedVideoId = extractVideoId(input);
        if (extractedVideoId) {
            videoId = extractedVideoId;
            try {
                const info = await youtube.getInfo(videoId);
                if (info.basic_info.channel_id) {
                    channelId = info.basic_info.channel_id;
                }
            } catch (e) {
                console.warn('Video fetch failed:', e);
            }
        }

        // 2. If not a video, try to resolve as Channel URL/Handle
        if (!channelId) {
            if (input.startsWith('UC')) {
                channelId = input;
            } else {
                try {
                    const resolved = await youtube.resolveURL(input);
                    if (resolved && resolved.payload && resolved.payload.browseId) {
                        channelId = resolved.payload.browseId;
                    }
                } catch (e) {
                    console.warn('Resolve failed:', e);
                }
            }
        }

        if (!channelId) {
            return { success: false, error: 'Could not resolve Channel ID.' };
        }

        // 3. Fetch Channel Details
        console.log('Fetching channel details for:', channelId);
        const channel = await youtube.getChannel(channelId);

        let channelTitle = channel.title || '';
        let avatarUrl = '';
        let bannerUrl = '';
        let subscriberCount = '';
        let videoCount = '';
        let viewCount = '';
        let joinedDate = '';

        // Extract Header Info (Reusing robust logic)
        if (channel.header) {
            // @ts-ignore
            const header = channel.header as any;

            // Handle C4TabbedHeaderRenderer
            if (header.type === 'C4TabbedHeaderRenderer' || header.title) {
                if (header.title?.text) channelTitle = header.title.text;
                else if (typeof header.title === 'string') channelTitle = header.title;

                if (header.avatar?.thumbnails?.[0]?.url) avatarUrl = header.avatar.thumbnails[0].url;
                else if (header.author?.thumbnails?.[0]?.url) avatarUrl = header.author.thumbnails[0].url;

                if (header.banner?.thumbnails?.[0]?.url) bannerUrl = header.banner.thumbnails[0].url;
                else if (header.banner?.[0]?.url) bannerUrl = header.banner[0].url;

                if (header.subscriber_count?.simple_text) subscriberCount = header.subscriber_count.simple_text;
                else if (header.subscribers?.simple_text) subscriberCount = header.subscribers.simple_text;

                if (header.videos_count?.simple_text) videoCount = header.videos_count.simple_text;
            }

            // Handle PageHeaderRenderer
            else if (header.type === 'PageHeaderRenderer' || header.type === 'PageHeader') {
                // @ts-ignore
                const pageHeader = header as any;

                if (pageHeader.page_title) channelTitle = pageHeader.page_title;
                else if (pageHeader.content?.title?.text?.text) channelTitle = pageHeader.content.title.text.text;
                else if (pageHeader.content?.pageHeaderViewModel?.title?.content) channelTitle = pageHeader.content.pageHeaderViewModel.title.content;

                if (pageHeader.content?.image?.avatar?.image?.[0]?.url) {
                    avatarUrl = pageHeader.content.image.avatar.image[0].url;
                } else if (pageHeader.content?.pageHeaderViewModel?.image?.sources?.[0]?.url) {
                    avatarUrl = pageHeader.content.pageHeaderViewModel.image.sources[0].url;
                }

                if (pageHeader.content?.banner?.image?.[0]?.url) {
                    bannerUrl = pageHeader.content.banner.image[0].url;
                }

                const metadataRows = pageHeader.content?.metadata?.metadata_rows || [];
                for (const row of metadataRows) {
                    const parts = row.metadata_parts || [];
                    // @ts-ignore
                    for (const part of parts) {
                        const text = part.text?.text;
                        if (!text) continue;

                        if (text.includes('subscribers')) {
                            subscriberCount = text;
                        } else if (text.includes('videos')) {
                            videoCount = text;
                        }
                    }
                }
            }
        }

        // Fetch "About" info for Views and Joined Date
        try {
            const about = await channel.getAbout();
            // @ts-ignore
            if (about.metadata) {
                // @ts-ignore
                if (about.metadata.view_count) viewCount = about.metadata.view_count;
                // @ts-ignore
                if (about.metadata.joined_date) joinedDate = about.metadata.joined_date.text || about.metadata.joined_date;
            }
        } catch (e) {
            console.warn('Failed to fetch About info:', e);
        }

        // 4. Determine Monetization Status
        let isMonetized = false;
        let reason = 'Channel analysis complete.';

        // Check 1: Subscribers Threshold
        const subsNum = parseSubscribers(subscriberCount);
        if (subsNum < 1000) {
            isMonetized = false;
            reason = 'Channel has fewer than 1,000 subscribers, which is below the monetization threshold.';
        } else {
            // Check 2: Video Metadata (if we have a video ID or can fetch latest)
            let checkVideoId = videoId;
            if (!checkVideoId) {
                // Try to get latest video ID from channel
                try {
                    const videos = await channel.getVideos();
                    if (videos.videos.length > 0) {
                        // @ts-ignore
                        checkVideoId = videos.videos[0].id;
                    }
                } catch (e) { }
            }

            if (checkVideoId) {
                try {
                    const videoInfo = await youtube.getInfo(checkVideoId);

                    // @ts-ignore
                    const microformat = videoInfo.microformat?.playerMicroformatRenderer;
                    // @ts-ignore
                    const playerResponse = videoInfo.player_response;
                    // @ts-ignore
                    const merchandise = videoInfo.merchandise;

                    // Check 1: Explicit Monetization Flag
                    if (microformat?.isMonetizationEnabled) {
                        isMonetized = true;
                        reason = 'Monetization is explicitly enabled in video metadata.';
                    }
                    // Check 2: Ads in Player Response
                    else if (playerResponse?.adPlacements?.length > 0 || playerResponse?.playerAds?.length > 0) {
                        isMonetized = true;
                        reason = 'Ads were detected on recent videos.';
                    }
                    // Check 3: Merchandise Shelf (Strong indicator of monetization)
                    else if (merchandise) {
                        isMonetized = true;
                        reason = 'Merchandise shelf detected, indicating monetization.';
                    }
                    // Check 4: High View Count + Subs (Inference)
                    else if (subsNum >= 1000) {
                        // If > 1000 subs and recent video has significant views, it's likely monetized even if ads aren't served to this specific request.
                        // We'll lean towards "Likely Monetized" if eligible and not unlisted/private.
                        if (!microformat?.isUnlisted && !microformat?.isPrivate) {
                            isMonetized = true;
                            reason = 'Channel meets monetization eligibility (1000+ subs) and content is public. (Ads may vary by viewer)';
                        } else {
                            isMonetized = false;
                            reason = 'Channel meets subscriber threshold, but video is unlisted or private.';
                        }
                    }
                } catch (e) {
                    reason = 'Could not analyze video for monetization.';
                }
            } else {
                reason = 'Could not find any videos to check for ads.';
            }
        }

        const result = {
            success: true,
            isMonetized,
            reason,
            channelDetails: {
                title: channelTitle || 'Unknown Channel',
                avatarUrl,
                bannerUrl,
                subscriberCount,
                viewCount,
                videoCount,
                channelUrl: `https://www.youtube.com/channel/${channelId}`,
                joinedDate
            }
        };

        return JSON.parse(JSON.stringify(result));

    } catch (error) {
        console.error('Error in checkMonetization:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}

function parseSubscribers(subText: string): number {
    if (!subText) return 0;
    const clean = subText.replace(/subscribers/i, '').trim().toUpperCase();
    let multiplier = 1;
    if (clean.endsWith('K')) multiplier = 1000;
    else if (clean.endsWith('M')) multiplier = 1000000;

    const num = parseFloat(clean.replace(/[KM]/g, ''));
    return isNaN(num) ? 0 : num * multiplier;
}
