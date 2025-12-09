import { Metadata } from 'next';
import YouTubeMonetizationCheckerClient from './client';

export const metadata: Metadata = {
    title: 'YouTube Monetization Checker | Dorexai',
    description: 'Check if a YouTube channel is monetized and analyze its eligibility. Free online tool to check monetization status.',
    keywords: ['youtube monetization checker', 'is channel monetized', 'check youtube monetization', 'youtube monetization status', 'youtube tools'],
};

export default function YouTubeMonetizationCheckerPage() {
    return <YouTubeMonetizationCheckerClient />;
}
