"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
}

export function CustomImageZoom({ src, alt }: Props) {
  const [showZoom, setShowZoom] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!src) return;
    setMounted(true);
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0,
      );
    };
    checkTouch();
  }, [src]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Scroll lock + navbar z-index override when modal opens
  useEffect(() => {
    if (!src) return;
    if (isModalOpen) {
      document.body.style.overflow = "hidden";

      // sticky navbar wrapper'ını modal arkasına gönder
      const navbarWrapper = document.querySelector(
        "[data-navbar-wrapper]",
      ) as HTMLElement;
      if (navbarWrapper) navbarWrapper.style.zIndex = "0";
    } else {
      document.body.style.overflow = "unset";

      const navbarWrapper = document.querySelector(
        "[data-navbar-wrapper]",
      ) as HTMLElement;
      if (navbarWrapper) navbarWrapper.style.zIndex = "";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // ESC key
  useEffect(() => {
    if (!src || !isModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [src, isModalOpen, handleClose]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice || !containerRef.current || !zoomLayerRef.current)
        return;

      const { left, top, width, height } =
        containerRef.current.getBoundingClientRect();

      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;

      const boundedX = Math.max(0, Math.min(100, x));
      const boundedY = Math.max(0, Math.min(100, y));

      zoomLayerRef.current.style.setProperty("--zoom-x", `${boundedX}%`);
      zoomLayerRef.current.style.setProperty("--zoom-y", `${boundedY}%`);
    },
    [isTouchDevice],
  );

  // Early return after all hooks — hooks must not be conditionally called
  if (!src) return null;

  const modal =
    isModalOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
            style={{ zIndex: 99999 }}
            onClick={handleClose}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 text-white hover:text-slate-300 transition-all duration-300 p-3 hover:bg-white/10 rounded-full group"
              style={{ zIndex: 100000 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Close"
            >
              <X
                size={32}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
            </button>

            {/* ESC hint */}
            <div
              className="absolute hidden top-6 left-6 text-white/60 text-sm font-medium md:flex items-center gap-2"
              style={{ zIndex: 100000 }}
            >
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
              <span>or click anywhere to close</span>
            </div>

            {/* Image Container */}
            <div
              className="relative w-[95vw] h-[95vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  quality={100}
                  priority
                  sizes="95vw"
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden cursor-zoom-in bg-white"
        onMouseEnter={() => !isTouchDevice && setShowZoom(true)}
        onMouseLeave={() => !isTouchDevice && setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-contain transition-opacity duration-300 ${
            showZoom && !isTouchDevice ? "opacity-0" : "opacity-100"
          }`}
          priority
        />

        {showZoom && !isTouchDevice && (
          <div
            ref={zoomLayerRef}
            className="absolute inset-0 pointer-events-none will-change-[background-position]"
            style={
              {
                backgroundImage: `url(${src})`,
                backgroundPosition: `var(--zoom-x, 50%) var(--zoom-y, 50%)`,
                backgroundSize: "250%",
                backgroundRepeat: "no-repeat",
                transition: "opacity 0.2s ease-in-out",
              } as React.CSSProperties
            }
          />
        )}
      </div>

      {modal}
    </>
  );
}
