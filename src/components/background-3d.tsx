import React from 'react';

interface Background3DProps {
    showSphere?: boolean;
}

export function Background3D({ showSphere = true }: Background3DProps) {
    return (
        <>
            {/* Background Elements */}
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-black pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50 animate-blob-1 -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/30 to-purple-200/30 rounded-full blur-3xl opacity-50 animate-blob-2 -z-10 pointer-events-none"></div>

            {/* 3D Background Element */}
            {showSphere && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none -z-10 animate-float">
                    <img
                        src="/hero-sphere.png"
                        alt="3D Abstract Sphere"
                        className="w-full h-full object-contain"
                    />
                </div>
            )}
        </>
    );
}
