'use server';

import { Innertube, UniversalCache } from 'youtubei.js';

export interface ChannelIdResult {
    success: boolean;
    channelId?: string;
    channelTitle?: string;
    channelHandle?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    channelUrl?: string;
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
    joinedDate?: string;
    error?: string;
}

export async function getChannelId(input: string): Promise<ChannelIdResult> {
    console.log('getChannelId called with:', input);
    try {
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        let channelId = '';

        // 1. Try to extract from Video URL
        const videoId = extractVideoId(input);
        console.log('Extracted Video ID:', videoId);

        if (videoId) {
            try {
                console.log('Fetching video info for:', videoId);
                const info = await youtube.getInfo(videoId);
                console.log('Video info fetched. Basic info:', info.basic_info ? 'Found' : 'Missing');

                if (info.basic_info.channel_id) {
                    channelId = info.basic_info.channel_id;
                    console.log('Found Channel ID from video:', channelId);
                } else {
                    console.warn('Video info found but channel_id is missing.');
                }
            } catch (e) {
                console.warn('Video fetch failed:', e);
            }
        }

        // 2. If not a video, try to resolve as Channel URL/Handle
        if (!channelId) {
            try {
                console.log('Resolving URL/Handle:', input);
                const resolved = await youtube.resolveURL(input);
                console.log('Resolve URL result:', resolved ? 'Found' : 'Null');

                if (resolved && resolved.payload) {
                    console.log('Resolved payload browseId:', resolved.payload.browseId);
                    if (resolved.payload.browseId) {
                        channelId = resolved.payload.browseId;
                    }
                }
            } catch (e) {
                console.warn('Resolve failed:', e);
            }
        }

        // 3. If we have a Channel ID, fetch full details
        if (channelId) {
            try {
                console.log('Fetching channel details for:', channelId);
                const channel = await youtube.getChannel(channelId);

                let channelTitle = channel.title || '';
                let avatarUrl = '';
                let bannerUrl = '';
                let channelHandle = '';
                let subscriberCount = '';
                let videoCount = '';
                let viewCount = '';
                let joinedDate = '';

                // Extract Header Info
                if (channel.header) {
                    console.log('Header found:', channel.header.type); // Log header type

                    // @ts-ignore
                    const header = channel.header;

                    // Handle C4TabbedHeaderRenderer (Common for channels)
                    if (header.type === 'C4TabbedHeaderRenderer' || header.title) {
                        // Title
                        if (header.title?.text) channelTitle = header.title.text;
                        else if (typeof header.title === 'string') channelTitle = header.title;

                        // Avatar
                        if (header.avatar?.thumbnails?.[0]?.url) avatarUrl = header.avatar.thumbnails[0].url;
                        else if (header.author?.thumbnails?.[0]?.url) avatarUrl = header.author.thumbnails[0].url;

                        // Banner
                        if (header.banner?.thumbnails?.[0]?.url) bannerUrl = header.banner.thumbnails[0].url;
                        else if (header.banner?.[0]?.url) bannerUrl = header.banner[0].url;

                        // Subscribers
                        if (header.subscriber_count?.simple_text) subscriberCount = header.subscriber_count.simple_text;
                        else if (header.subscribers?.simple_text) subscriberCount = header.subscribers.simple_text;

                        // Videos
                        if (header.videos_count?.simple_text) videoCount = header.videos_count.simple_text;
                    }

                    // Handle PageHeaderRenderer (Newer layout)
                    else if (header.type === 'PageHeaderRenderer' || header.type === 'PageHeader') {
                        // @ts-ignore
                        const pageHeader = header as any;

                        // Title
                        if (pageHeader.page_title) channelTitle = pageHeader.page_title;
                        else if (pageHeader.content?.title?.text?.text) channelTitle = pageHeader.content.title.text.text;
                        else if (pageHeader.content?.pageHeaderViewModel?.title?.content) channelTitle = pageHeader.content.pageHeaderViewModel.title.content;

                        // Avatar
                        if (pageHeader.content?.image?.avatar?.image?.[0]?.url) {
                            avatarUrl = pageHeader.content.image.avatar.image[0].url;
                        } else if (pageHeader.content?.pageHeaderViewModel?.image?.sources?.[0]?.url) {
                            avatarUrl = pageHeader.content.pageHeaderViewModel.image.sources[0].url;
                        }

                        // Banner
                        if (pageHeader.content?.banner?.image?.[0]?.url) {
                            bannerUrl = pageHeader.content.banner.image[0].url;
                        }

                        // Metadata (Subscribers, Videos, Handle)
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
                                } else if (text.startsWith('@')) {
                                    channelHandle = text.substring(1); // Remove @
                                }
                            }
                        }
                    }
                } else {
                    console.log('No header found in channel response');
                }

                // Fallback: If title is still missing, try metadata
                if (!channelTitle && channel.metadata?.title) {
                    // @ts-ignore
                    channelTitle = channel.metadata.title;
                }
                if (!avatarUrl && channel.metadata?.avatar?.thumbnails?.[0]?.url) {
                    // @ts-ignore
                    avatarUrl = channel.metadata.avatar.thumbnails[0].url;
                }

                // Fetch "About" info for Views and Joined Date
                try {
                    console.log('Fetching About info...');
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

                const result = {
                    success: true,
                    channelId,
                    channelTitle: channelTitle || 'Unknown Channel',
                    channelHandle,
                    avatarUrl,
                    bannerUrl,
                    channelUrl: `https://www.youtube.com/channel/${channelId}`,
                    subscriberCount,
                    videoCount,
                    viewCount,
                    joinedDate
                };

                // Ensure everything is a string or primitive to avoid serialization errors
                return JSON.parse(JSON.stringify(result));

            } catch (error) {
                console.error('Failed to fetch channel details:', error);
                // Even if details fail, return the ID if we have it
                return {
                    success: true,
                    channelId,
                    channelUrl: `https://www.youtube.com/channel/${channelId}`,
                    error: 'Found ID but failed to fetch some details.'
                };
            }
        }

        return { success: false, error: 'Could not resolve Channel ID. Please check the URL or Handle.' };

    } catch (error) {
        console.error('Error in getChannelId:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}
