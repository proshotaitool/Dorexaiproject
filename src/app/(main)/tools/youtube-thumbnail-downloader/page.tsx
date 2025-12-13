import { Metadata } from 'next';
import YoutubeThumbnailDownloaderClient from './client';

export const metadata: Metadata = {
    title: 'YouTube Thumbnail Downloader | Download HD, HQ, 4K Thumbnails',
    description: 'Download high-quality thumbnails from any YouTube video instantly. Supports 4K, HD (1080p), HQ, and more. Free and easy to use.',
    keywords: ['youtube thumbnail downloader', 'download youtube thumbnail', 'youtube thumbnail grabber', 'save youtube thumbnail', 'get youtube thumbnail'],
};

export default function YoutubeThumbnailDownloaderPage() {
    return <YoutubeThumbnailDownloaderClient />;
}
