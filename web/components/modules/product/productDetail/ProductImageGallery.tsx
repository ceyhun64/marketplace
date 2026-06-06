"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ShieldCheck, Play, Pause, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomImageZoom } from "./ImageZoom";

interface ProductImageGalleryProps {
  images: string[];
  videoUrl?: string | null;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  hasDiscount: boolean;
  discountPercentage: number;
  productTitle: string;
}

// --- Video Player --------------------------------------------------------------
function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(
        () => setShowControls(false),
        3000,
      );
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    resetHideTimer();
  }, [resetHideTimer]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white flex items-center justify-center select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={handlePlayPause}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:scale-110 transition-transform">
            <Play size={26} className="text-white ml-1" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        <div className="relative px-4 pb-3 pt-2 pointer-events-auto flex items-center justify-between">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-red-400 transition-colors p-1"
            style={{ transition: "color 140ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={handleFullscreen}
            className="text-white hover:text-red-400 transition-colors p-1"
            style={{ transition: "color 140ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Gallery --------------------------------------------------------------
export default function ProductImageGallery({
  images,
  videoUrl,
  activeIndex,
  onIndexChange,
  hasDiscount,
  discountPercentage,
  productTitle,
}: ProductImageGalleryProps) {
  const thumbVideoRef = useRef<HTMLVideoElement>(null);
  const [thumbHovered, setThumbHovered] = useState(false);

  const videoThumbIndex = images.length;
  const isVideoActive = videoUrl ? activeIndex === videoThumbIndex : false;

  useEffect(() => {
    const v = thumbVideoRef.current;
    if (!v || !videoUrl) return;
    if (thumbHovered) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [thumbHovered, videoUrl]);

  return (
    <div className="lg:col-span-6 flex flex-col lg:flex-row gap-4">
      {/* Thumbnail Strip */}
      <div className="order-2 lg:order-1 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[640px] no-scrollbar px-0.5 py-0.5">
        {images.map((img, i) => (
          <button
            key={`img-${i}`}
            onClick={() => onIndexChange(i)}
            className="relative flex-shrink-0"
            style={{
              width: "72px",
              aspectRatio: "3/4",
              borderRadius: "8px",
              overflow: "hidden",
              transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
              background: "#ffffff",
              border:
                !isVideoActive && activeIndex === i
                  ? "2px solid #c8102e"
                  : "1.5px solid rgba(30,30,30,0.18)",
              opacity: !isVideoActive && activeIndex === i ? 1 : 0.55,
            }}
            onMouseEnter={(e) => {
              if (isVideoActive || activeIndex !== i) {
                e.currentTarget.style.opacity = "0.8";
                e.currentTarget.style.borderColor = "rgba(30,30,30,0.32)";
              }
            }}
            onMouseLeave={(e) => {
              if (isVideoActive || activeIndex !== i) {
                e.currentTarget.style.opacity = "0.55";
                e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
              }
            }}
          >
            <Image
              src={img}
              alt={`${productTitle} image ${i + 1}`}
              fill
              className="object-contain p-1"
            />
          </button>
        ))}

        {/* Video Thumbnail */}
        {videoUrl && (
          <button
            onClick={() => onIndexChange(videoThumbIndex)}
            onMouseEnter={() => setThumbHovered(true)}
            onMouseLeave={() => setThumbHovered(false)}
            className="relative flex-shrink-0"
            style={{
              width: "72px",
              aspectRatio: "3/4",
              borderRadius: "8px",
              overflow: "hidden",
              transition: "all 140ms cubic-bezier(0.16,1,0.3,1)",
              background: "#ffffff",
              border: isVideoActive
                ? "2px solid #c8102e"
                : "1.5px solid rgba(30,30,30,0.18)",
              opacity: isVideoActive ? 1 : 0.55,
            }}
          >
            <video
              ref={thumbVideoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200",
                thumbHovered ? "opacity-0" : "opacity-100",
              )}
            >
              <div className="w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                <Play size={11} className="text-slate-900 ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-3 pb-1 text-center">
              <span
                className="text-white text-[7px] font-bold uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Video
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Main Display */}
      <div className="order-1 lg:order-2 flex-1">
        <div
          className="relative aspect-[3/4] w-full bg-white overflow-hidden"
          style={{
            border: "1px solid rgba(30,30,30,0.1)",
            boxShadow:
              "0 1px 4px rgba(30,30,30,0.06), 0 1px 2px rgba(30,30,30,0.04)",
            borderRadius: "14px",
          }}
        >
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold uppercase tracking-tight"
              style={{
                background: "rgba(30,30,30,0.85)",
                color: "#ffffff",
                borderRadius: "4px",
                fontFamily: "'JetBrains Mono', monospace",
                backdropFilter: "blur(4px)",
              }}
            >
              <ShieldCheck size={10} style={{ color: "#c8102e" }} /> Certified
              Protection
            </span>
            {hasDiscount && (
              <span
                className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-tight"
                style={{
                  background: "#c8102e",
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Video or Image */}
          {isVideoActive && videoUrl ? (
            <VideoPlayer videoUrl={videoUrl} />
          ) : (images[activeIndex] ?? images[0]) ? (
            <CustomImageZoom
              src={images[activeIndex] ?? images[0]}
              alt={productTitle}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
