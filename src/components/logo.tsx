import { Hexagon } from 'lucide-react';

export const Logo = ({ className = "", iconClassName = "h-8 w-8", textClassName = "text-xl" }: { className?: string, iconClassName?: string, textClassName?: string }) => {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Hexagon className={`text-primary fill-primary/20 drop-shadow-lg ${iconClassName}`} strokeWidth={2.5} />
            <span className={`font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent drop-shadow-md ${textClassName}`}>
                Dorexai
            </span>
        </div>
    );
};
