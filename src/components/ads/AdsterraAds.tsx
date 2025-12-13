'use client';

import { useEffect, useRef } from 'react';

type AdType = 'banner_300x250' | 'banner_160x600' | 'banner_468x60' | 'social_bar' | 'native_banner';

interface AdsterraAdsProps {
    type: AdType;
}

export function AdsterraAds({ type }: AdsterraAdsProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        container.innerHTML = ''; // Clear previous ad content to prevent duplication

        if (type === 'banner_300x250') {
            const scriptOptions = document.createElement('script');
            scriptOptions.type = 'text/javascript';
            scriptOptions.innerHTML = `
                atOptions = {
                    'key' : 'b253adfa0ca6e11b49bcdbf0cd5c04a8',
                    'format' : 'iframe',
                    'height' : 250,
                    'width' : 300,
                    'params' : {}
                };
            `;
            const scriptInvoke = document.createElement('script');
            scriptInvoke.type = 'text/javascript';
            scriptInvoke.src = '//www.highperformanceformat.com/b253adfa0ca6e11b49bcdbf0cd5c04a8/invoke.js';

            container.appendChild(scriptOptions);
            container.appendChild(scriptInvoke);
        } else if (type === 'banner_160x600') {
            const scriptOptions = document.createElement('script');
            scriptOptions.type = 'text/javascript';
            scriptOptions.innerHTML = `
                atOptions = {
                    'key' : '1dd7e06c56b8d5c6318c6be4bd527b06',
                    'format' : 'iframe',
                    'height' : 600,
                    'width' : 160,
                    'params' : {}
                };
            `;
            const scriptInvoke = document.createElement('script');
            scriptInvoke.type = 'text/javascript';
            scriptInvoke.src = '//www.highperformanceformat.com/1dd7e06c56b8d5c6318c6be4bd527b06/invoke.js';

            container.appendChild(scriptOptions);
            container.appendChild(scriptInvoke);
        } else if (type === 'banner_468x60') {
            const scriptOptions = document.createElement('script');
            scriptOptions.type = 'text/javascript';
            scriptOptions.innerHTML = `
                atOptions = {
                    'key' : '798c06f0c6d7bb8d269491129c75af9c',
                    'format' : 'iframe',
                    'height' : 60,
                    'width' : 468,
                    'params' : {}
                };
            `;
            const scriptInvoke = document.createElement('script');
            scriptInvoke.type = 'text/javascript';
            scriptInvoke.src = '//www.highperformanceformat.com/798c06f0c6d7bb8d269491129c75af9c/invoke.js';

            container.appendChild(scriptOptions);
            container.appendChild(scriptInvoke);
        } else if (type === 'social_bar') {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//pl28220738.effectivegatecpm.com/25/20/59/252059939d652f6da1ec7c891138cf2a.js';
            container.appendChild(script);
        } else if (type === 'native_banner') {
            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = '//pl28220035.effectivegatecpm.com/d8cb2109af6cbf91fe2c8d4026541b3e/invoke.js';

            const div = document.createElement('div');
            div.id = 'container-d8cb2109af6cbf91fe2c8d4026541b3e';

            container.appendChild(script);
            container.appendChild(div);
        }

    }, [type]);

    /* CSS to center the ads */
    return <div ref={containerRef} className="flex justify-center items-center my-4 overflow-hidden" />;
}
