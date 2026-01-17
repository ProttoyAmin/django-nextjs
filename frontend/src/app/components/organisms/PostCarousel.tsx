"use client";

import { PostType } from "@/src/types/post";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import React from "react";
import VideoPlayer from "../atoms/VideoPlayer";

interface PostCarouselProps {
  post: PostType;
  fullHeight?: boolean;
  contain?: boolean;
}

function PostCarousel({
  post,
  fullHeight = false,
  contain = false,
}: PostCarouselProps) {
  const medias = post.media_files || [];

  if (medias.length === 0 && post.content) {
    return (
      <div
        className={`w-full bg-black ${
          fullHeight ? "h-full" : ""
        } flex items-center justify-center p-8`}
      >
        <p className="text-center text-lg">{post.content}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full relative bg-black ${fullHeight ? "h-full" : ""}`}>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          draggable={true}
          grabCursor={true}
          loop={medias.length > 1}
          pagination={{
            clickable: true,
          }}
          className={`w-full ${fullHeight ? "h-full" : ""}`}
          style={
            {
              "--swiper-navigation-color": "#fff",
              "--swiper-pagination-color": "#fff",
            } as React.CSSProperties
          }
        >
          {medias.map((media) => (
            <SwiperSlide key={media.id} className="w-full h-full text-white">
              <div
                className={`w-auto h-auto relative bg-black flex items-center justify-center ${
                  fullHeight ? "h-full" : "aspect-square"
                }`}
              >
                {media.image_file ? (
                  <Image
                    src={media.image_file}
                    alt="post image"
                    fill
                    className={`${contain ? "object-contain" : "object-cover"}`}
                    sizes="(max-width: 768px) 100vw, 600px"
                    priority
                  />
                ) : media.video_file ? (
                  <VideoPlayer src={media.video_file} contain />
                ) : null}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

export default React.memo(PostCarousel);
