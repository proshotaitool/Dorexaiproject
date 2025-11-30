'use client';

import { useEffect } from 'react';

type AdUnitProps = {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
};

export function AdUnit({ slotId, format = 'auto', className }: AdUnitProps) {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    if (process.env.NODE_ENV === 'development') {
        return (
            <div className={`bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground text-sm font-mono p-4 rounded-xl ${className}`} style={{ minHeight: '250px' }}>
                AdSense Placeholder (Slot: {slotId})
            </div>
        );
    }

    return (
        <div className={className}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7518015096859683"
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
