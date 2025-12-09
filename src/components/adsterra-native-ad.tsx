'use client';

import { useEffect, useRef } from 'react';

export function AdsterraNativeAd() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Prevent double injection if strict mode or re-renders occur
        if (containerRef.current && containerRef.current.childElementCount > 0) {
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = "false";
        script.src = "//pl28220035.effectivegatecpm.com/d8cb2109af6cbf91fe2c8d4026541b3e/invoke.js";

        const containerDiv = document.createElement('div');
        containerDiv.id = "container-d8cb2109af6cbf91fe2c8d4026541b3e";

        if (containerRef.current) {
            containerRef.current.appendChild(script);
            containerRef.current.appendChild(containerDiv);
        }

        return () => {
            // Cleanup if necessary, though external scripts usually manage their own lifecycle.
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full flex justify-center my-4 min-h-[100px]" />
    );
}
