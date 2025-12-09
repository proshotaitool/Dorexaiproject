import OrganizePdfClient from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Organize PDF - Reorder, Rotate & Delete Pages | DoreX Ai',
    description: 'Easily organize your PDF files. Reorder, rotate, and delete pages directly in your browser. Fast, free, and secure.',
    keywords: ['organize pdf', 'reorder pdf pages', 'rotate pdf', 'delete pdf pages', 'pdf editor', 'free pdf tool'],
};

export default function OrganizePdfPage() {
    return <OrganizePdfClient />;
}
