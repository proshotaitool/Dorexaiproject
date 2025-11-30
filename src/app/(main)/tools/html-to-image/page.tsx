import type { Metadata } from 'next';
import HtmlToImageClient from './client';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'HTML to Image Converter | Free Online Tool',
  description: 'Convert HTML code, files, or URLs to high-quality images (PNG, JPG, WEBP). Customize viewport, quality, and more with our free online tool.',
  keywords: ['html to image', 'html to png', 'screenshot website', 'convert html to jpg', 'webpage capture'],
};

export default function HtmlToImagePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'HTML to Image Converter',
    'applicationCategory': 'MultimediaApplication',
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'description': 'Convert HTML code, files, or URLs to high-quality images (PNG, JPG, WEBP) instantly.',
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <HtmlToImageClient />
    </>
  );
}
