"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Eye,
  Sparkles,
  ImagePlus,
  ShieldCheck,
  X,
  Play,
  Pause,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomImageZoom } from "./imageZoom";

interface ProductImageGalleryProps {
  images: string[];
  videoUrl?: string | null;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  customDesign: string | null;
  uploadedImagePreview: string | null;
  hasDiscount: boolean;
  discountPercentage: number;
  onShowPreview: () => void;
  onRemoveCustomDesign: () => void;
  onRemoveUploadedImage: () => void;
  productTitle: string;
}

// ─── Video Player ──────────────────────────────────────────────────────────────
function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-hide controls after 3s when playing
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

  // Fullscreen listener
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
      {/* Video */}
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

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center Play Button (when paused) */}
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

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Control Bar */}
        <div className="relative px-4 pb-3 pt-2 pointer-events-auto flex items-center justify-between">
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-orange-400 transition-colors p-1"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={handleFullscreen}
            className="text-white hover:text-orange-400 transition-colors p-1"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Gallery ──────────────────────────────────────────────────────────────
export default function ProductImageGallery({
  images,
  videoUrl,
  activeIndex,
  onIndexChange,
  customDesign,
  uploadedImagePreview,
  hasDiscount,
  discountPercentage,
  onShowPreview,
  onRemoveCustomDesign,
  onRemoveUploadedImage,
  productTitle,
}: ProductImageGalleryProps) {
  const thumbVideoRef = useRef<HTMLVideoElement>(null);
  const [thumbHovered, setThumbHovered] = useState(false);

  const finalCustomImage = customDesign || uploadedImagePreview;
  const displayImages = finalCustomImage
    ? [finalCustomImage, ...images]
    : images;
  const videoThumbIndex = displayImages.length;
  const isVideoActive = videoUrl ? activeIndex === videoThumbIndex : false;

  // Hover preview on video thumbnail
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
        {displayImages.map((img, i) => (
          <button
            key={`img-${i}`}
            onClick={() => onIndexChange(i)}
            className={cn(
              "relative w-[72px] md:w-20 aspect-[3/4] rounded overflow-hidden transition-all duration-200 flex-shrink-0 bg-white",
              !isVideoActive && activeIndex === i
                ? "ring- ring-orange-500 opacity-100"
                : "ring-1 ring-slate-200 opacity-55 hover:opacity-80 hover:ring-slate-300",
            )}
          >
            {i === 0 && finalCustomImage && (
              <div className="absolute top-0 left-0 bg-orange-600 text-white text-[6px] font-bold px-1 py-0.5 uppercase z-10 leading-tight">
                Özel
              </div>
            )}
            <Image
              src={img}
              alt={`${productTitle} görsel ${i + 1}`}
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
            className={cn(
              "relative w-[72px] md:w-20 aspect-[3/4] rounded overflow-hidden transition-all duration-200 flex-shrink-0 bg-white",
              isVideoActive
                ? "ring-2 ring-orange-500 opacity-100"
                : "ring-1 ring-slate-200 opacity-55 hover:opacity-80 hover:ring-slate-300",
            )}
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
              <span className="text-white text-[7px] font-bold uppercase tracking-widest">
                Video
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Main Display */}
      <div className="order-1 lg:order-2 flex-1 space-y-3">
        <div className="relative aspect-[3/4] w-full bg-white overflow-hidden border border-slate-100 shadow-sm">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            {customDesign ? (
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 text-white text-[8px] font-bold px-2.5 py-1 uppercase tracking-tight flex items-center gap-1.5 animate-pulse rounded-sm">
                <Sparkles size={10} /> Tasarım Paneli ile Özelleştirildi
              </span>
            ) : uploadedImagePreview ? (
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] font-bold px-2.5 py-1 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
                <ImagePlus size={10} /> Özel Resim Yüklendi
              </span>
            ) : (
              <span className="bg-slate-900/85 backdrop-blur text-white text-[8px] font-bold px-2.5 py-1 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
                <ShieldCheck size={10} className="text-orange-400" />{" "}
                Sertifikalı Koruma
              </span>
            )}
            {hasDiscount && (
              <span className="bg-orange-600 text-white text-[8px] font-bold px-2.5 py-1 uppercase tracking-tight rounded-sm">
                %{discountPercentage} İndirim
              </span>
            )}
          </div>

          {/* Video or Image */}
          {isVideoActive && videoUrl ? (
            <VideoPlayer videoUrl={videoUrl} />
          ) : (
            <>
              <div className="absolute bottom-3 right-3 md:bottom-auto md:top-3 md:right-3 z-20 flex gap-2">
                <button
                  onClick={onShowPreview}
                  className="bg-orange-600 text-white px-3 py-2 text-[10px] sm:px-5 sm:py-3 sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-xl hover:bg-slate-900 transition-all rounded-sm"
                >
                  <Eye size={13} className="sm:w-4 sm:h-4" />
                  {customDesign || uploadedImagePreview
                    ? "Yeniden Tasarla"
                    : "Logonu Ekle"}
                </button>
              </div>
              <CustomImageZoom
                src={displayImages[activeIndex] ?? displayImages[0]}
                alt={productTitle}
              />
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          {uploadedImagePreview && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2.5 rounded">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <ImagePlus size={13} />
                <span className="font-semibold">Özel resim yüklendi</span>
              </div>
              <button
                onClick={onRemoveUploadedImage}
                className="text-blue-400 hover:text-red-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {customDesign && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-3 py-2.5 rounded">
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <Sparkles size={13} />
                <span className="font-semibold">
                  Tasarım paneli ile özelleştirildi
                </span>
              </div>
              <button
                onClick={onRemoveCustomDesign}
                className="text-orange-400 hover:text-red-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
