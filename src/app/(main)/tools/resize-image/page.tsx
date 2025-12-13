import { Metadata } from 'next';
import ResizeImageClient from './client';

export const metadata: Metadata = {
  title: 'AI-Enhanced Image Resizer | Resize By Pixels or Percentage',
  description: 'Easily resize images by exact pixels or percentage. Features AI smart suggestions for social media and preserves aspect ratio. Free online tool.',
  keywords: ['resize image', 'image resizer', 'resize photo', 'change image size', 'online image resizer', 'ai image resize'],
};

export default function ResizeImagePage() {
  return <ResizeImageClient />;
}
