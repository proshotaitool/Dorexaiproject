
import type { Metadata } from 'next';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/use-translation';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { FirebaseClientProvider } from '@/firebase';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  metadataBase: new URL('https://dorexai.space'),
  title: {
    default: 'DoreX Ai - The Ultimate Toolkit for Your Digital Files',
    template: '%s | DoreX Ai',
  },
  description: 'An all-in-one suite of tools for images, PDFs, text, and AI-powered tasks. Compress, edit, convert, and create with DoreX Ai.',
  keywords: ['Image tools', 'PDF tools', 'AI content generator', 'image compressor', 'pdf merger', 'free tools', 'online tools'],
  authors: [{ name: 'DoreX Ai Team', url: 'https://dorexai.space/about' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'DoreX Ai - The Ultimate Toolkit for Your Digital Files',
    description: 'An all-in-one suite of tools for images, PDFs, text, and AI-powered tasks.',
    url: 'https://dorexai.space',
    siteName: 'DoreX Ai',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoreX Ai - The Ultimate Toolkit for Your Digital Files',
    description: 'An all-in-one suite of tools for images, PDFs, text, and AI-powered tasks.',
    images: ['/twitter-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7518015096859683"
          crossOrigin="anonymous"></script>
        {/* Google Analytics */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-85CS5XKZYS"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-85CS5XKZYS');
          `}
        </Script>
      </head>
      <body className={cn('font-body antialiased overflow-x-hidden', inter.variable)} suppressHydrationWarning>
        <FirebaseClientProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
