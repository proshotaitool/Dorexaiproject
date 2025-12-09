import { Metadata } from 'next';
import PdfToPowerPointClient from './client';

export const metadata: Metadata = {
    title: 'PDF to PowerPoint Converter | Dorexai',
    description: 'Convert PDF documents to editable PowerPoint presentations with live preview. Free online tool, no signup required.',
    keywords: ['pdf to ppt', 'pdf to powerpoint', 'convert pdf to pptx', 'online pdf converter', 'free pdf tools'],
};

export default function PdfToPowerPointPage() {
    return <PdfToPowerPointClient />;
}
