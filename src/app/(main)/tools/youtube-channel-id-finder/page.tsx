import { Metadata } from 'next';
import YouTubeChannelIdFinderClient from './client';

export const metadata: Metadata = {
    title: 'YouTube Channel ID Finder | Dorexai',
    description: 'Find the unique Channel ID of any YouTube channel from a video URL or channel handle. Free online tool.',
    keywords: ['youtube channel id', 'find youtube channel id', 'youtube channel id finder', 'get youtube channel id', 'youtube tools'],
};

export default function YouTubeChannelIdFinderPage() {
    return <YouTubeChannelIdFinderClient />;
}
