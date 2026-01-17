"use client";

import { useState, useId } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, A11y } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { MediaFile } from "@/src/types/post";

interface MediaCarouselProps {
    medias: MediaFile[];
    content?: string | null;
    className?: string;
}

export default function MediaCarousel({
    medias,
    content,
    className = "",
}: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const uniqueId = useId();
    const prevButtonClass = `prev-${uniqueId}`;
    const nextButtonClass = `next-${uniqueId}`;

    if (!medias || medias.length === 0) return null;

    if (medias.length === 1) {
        const media = medias[0];
        return (
            <div className={`relative w-full rounded-lg overflow-hidden ${className}`}>
                <div className="relative aspect-square md:aspect-video">
                    {media.media_type === "IMAGE" ? (
                        <Image
                            src={media.image_file || media.image_url || ''}
                            alt="Post media"
                            fill
                            className="object-contain"
                            priority
                        />
                    ) : (
                        <>
                            <video
                                src={media.video_file}
                                controls
                                className="w-full h-full object-contain"
                            >
                                <source src={media.video_file} type="video/mp4" />
                            </video>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full rounded-lg overflow-hidden ${className}`}>
            <Swiper
                modules={[Navigation, Pagination, Keyboard, A11y]}
                spaceBetween={0}
                slidesPerView={1}
                loop={true}
                navigation={{
                    enabled: true,
                    nextEl: `.${nextButtonClass}`,
                    prevEl: `.${prevButtonClass}`,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: false,
                    renderBullet: function (index, className) {
                        return `<span class="${className} bg-white/70 hover:bg-white"></span>`;
                    }
                }}
                keyboard={{ enabled: true, onlyInViewport: true }}
                onSlideChange={(swiper: SwiperClass) => {
                    setCurrentIndex(swiper.activeIndex);
                }}
                className="h-full"
            >
                {medias.map((media, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative aspect-square md:aspect-video">
                            {media.media_type === "IMAGE" ? (
                                <Image
                                    src={media.image_file || media.image_url || ''}
                                    alt={`Media of ${index + 1}`}
                                    fill
                                    className="object-contain"
                                    priority={index === 0}
                                />
                            ) : (
                                <video
                                    src={media.video_file || media.video_url}
                                    controls
                                    className="w-full h-full object-contain"
                                    autoPlay={index === 0}
                                >
                                    <source src={media.video_file || media.video_url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons with unique class names */}
            <button
                className={`${prevButtonClass} absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all z-20 disabled:opacity-30`}
                aria-label="Previous media"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>
            <button
                className={`${nextButtonClass} absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all z-20 disabled:opacity-30`}
                aria-label="Next media"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            {/* Counter */}
            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-20">
                {currentIndex + 1} / {medias.length}
            </div>
        </div>
    );
}