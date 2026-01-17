"use client";

interface TextPostProps {
    content: string;
    className?: string;
}

export default function TextPost({ content, className = "" }: TextPostProps) {
    return (
        <>
            <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
                <div className="relative aspect-square md:aspect-video flex items-center justify-center p-6">
                    <p className="text-center text-sm md:text-base whitespace-pre-wrap drop-shadow-lg">
                        {content}
                    </p>
                </div>
            </div>
        </>
    );
}