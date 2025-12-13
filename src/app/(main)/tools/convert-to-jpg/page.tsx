import type { Metadata } from 'next';
import ConvertToJpgClient from './client';

export const metadata: Metadata = {
  title: 'Convert Images to JPG Online | Dorexai',
  description: 'Easily transform your PNG, WEBP, GIF, or other image formats into high-quality JPG files. Use our AI to suggest the best quality settings for optimal results.',
  keywords: ['convert to jpg', 'png to jpg', 'webp to jpg', 'image converter', 'online jpg converter', 'ai image optimizer'],
};

export default function ConvertToJpgPage() {
  return <ConvertToJpgClient />;
}
