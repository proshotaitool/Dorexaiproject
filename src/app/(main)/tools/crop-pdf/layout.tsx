import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Crop PDF Tool | Dorexai',
    description: 'Trim margins and crop pages in your PDF documents. Free online PDF cropper with preview.',
    keywords: ['crop pdf', 'trim pdf', 'pdf cropper', 'online pdf editor', 'free pdf tools'],
};

export default function CropPdfLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
