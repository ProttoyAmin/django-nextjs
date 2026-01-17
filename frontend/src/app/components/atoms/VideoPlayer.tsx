"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  contain?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  contain = false,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRates] = useState([0.5, 0.75, 1, 1.25, 1.5, 2]);
  const [volumeSliderTimeout, setVolumeSliderTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Load saved volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem("videoPlayerVolume");
    if (savedVolume) {
      const parsedVolume = parseInt(savedVolume, 10);
      setVolume(Math.max(0, Math.min(100, parsedVolume)));
    }
  }, []);

  // Apply volume to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Save volume to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("videoPlayerVolume", volume.toString());
    console.log("Volume saved to localStorage:", volume);
  }, [volume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      // Unmute and restore previous volume
      setIsMuted(false);
      if (volume === 0) {
        setVolume(50);
      }
    } else {
      // Mute
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number) => {
    const newVolume = Math.max(0, Math.min(100, value));
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const handleVolumeIconMouseEnter = () => {
    if (volumeSliderTimeout) {
      clearTimeout(volumeSliderTimeout);
    }
    setShowVolumeSlider(true);
  };

  const handleVolumeIconMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
    setVolumeSliderTimeout(timeout);
  };

  const handleVolumeSliderMouseEnter = () => {
    if (volumeSliderTimeout) {
      clearTimeout(volumeSliderTimeout);
    }
    setShowVolumeSlider(true);
  };

  const handleVolumeSliderMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
    setVolumeSliderTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeSliderTimeout) {
        clearTimeout(volumeSliderTimeout);
      }
    };
  }, [volumeSliderTimeout]);

  return (
    <div
      className={`group relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className={`w-full h-full cursor-pointer ${
          contain ? "object-contain" : "object-cover"
        }`}
        playsInline
      />

      {/* Play/Pause Center Overlay (Shows briefly on state change or hover) */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
        >
          <div className="bg-black/50 p-4 rounded-full text-white backdrop-blur-sm">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary hover:h-1.5 transition-all"
            style={{
              background: `linear-gradient(to right, #ffffff ${progress}%, #000000 ${progress}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Left side: Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-primary transition-colors"
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </button>

          {/* Center: Volume control */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-2">
              <button
                onClick={toggleMute}
                onMouseEnter={handleVolumeIconMouseEnter}
                onMouseLeave={handleVolumeIconMouseLeave}
                className="text-white hover:text-primary transition-colors bg-black/40 p-2 rounded-full backdrop-blur-sm"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              {/* Volume Slider - Horizontal */}
              <div
                ref={volumeRef}
                className={`flex items-center gap-2 transition-all duration-300 overflow-hidden ${
                  showVolumeSlider ? "opacity-100 w-24" : "opacity-0 w-0"
                }`}
                onMouseEnter={handleVolumeSliderMouseEnter}
                onMouseLeave={handleVolumeSliderMouseLeave}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
                  style={{
                    background: `linear-gradient(to right, #ffffff ${volume}%, #000000 ${volume}%)`,
                  }}
                />
                <span className="text-white text-xs font-mono min-w-[30px]">
                  {volume}%
                </span>
              </div>
            </div>

            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-primary transition-colors bg-black/40 p-2 rounded-full backdrop-blur-sm"
              >
                <Settings size={20} />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute bottom-full left-0 mb-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 min-w-[120px]">
                  <div className="text-white text-xs font-medium mb-2 px-2">
                    Playback Speed
                  </div>
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-primary transition-colors bg-black/40 p-2 rounded-full backdrop-blur-sm"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
