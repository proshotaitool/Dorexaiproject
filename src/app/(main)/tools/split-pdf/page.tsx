import SplitPdfClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Split PDF - Extract Pages from PDF | DoreX Ai',
    description: 'Split PDF files online for free. Extract specific pages or split documents into multiple files. Fast, secure, and easy to use.',
    keywords: ['split pdf', 'extract pdf pages', 'cut pdf', 'pdf splitter', 'free pdf tool'],
};

export default function SplitPdfPage() {
    return <SplitPdfClient />;
}
