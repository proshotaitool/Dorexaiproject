import MergePdfClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Merge PDF - Combine Multiple PDF Files | DoreX Ai',
    description: 'Combine multiple PDF files into one document for free. Drag and drop to reorder files. Fast, secure, and easy to use.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'pdf merger', 'free pdf tool'],
};

export default function MergePdfPage() {
    return <MergePdfClient />;
}
