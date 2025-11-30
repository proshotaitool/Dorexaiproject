import type { Metadata } from 'next';
import CompressImageClient from './client';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Image Compressor | Reduce File Size Online',
  description: 'Compress JPG, PNG, and WEBP images online for free. Reduce file size without losing quality. Bulk compression supported.',
  keywords: ['compress image', 'reduce image size', 'image optimizer', 'jpg compressor', 'png compressor', 'webp compressor'],
};

export default function CompressImagePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Image Compressor',
    'applicationCategory': 'MultimediaApplication',
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'description': 'Reduce image file sizes for JPEG, PNG, and WEBP formats with our smart compression tool.',
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <CompressImageClient />
    </>
  );
}
