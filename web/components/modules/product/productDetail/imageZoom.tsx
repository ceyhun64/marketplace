"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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

  // Render nothing if src is empty
  if (!src) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomLayerRef = useRef<HTMLDivElement>(null);

  // Check if the device is touch-based
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0,
      );
    };
    checkTouch();
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Hide body scroll, topbar, navbar and CategoryBar when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Disable body scroll
      document.body.style.overflow = "hidden";

      // Hide topbar
      const topbar = document.querySelector("[data-topbar]") as HTMLElement;
      if (topbar) {
        topbar.style.display = "none";
      }

      // Hide navbar
      const navbar = document.querySelector("[data-navbar]") as HTMLElement;
      if (navbar) {
        navbar.style.display = "none";
      }

      // Hide CategoryBar
      const categoryBar = document.querySelector(
        "[data-category-bar]",
      ) as HTMLElement;
      if (categoryBar) {
        categoryBar.style.display = "none";
      }
    } else {
      // Restore everything when modal closes
      document.body.style.overflow = "unset";

      const topbar = document.querySelector("[data-topbar]") as HTMLElement;
      if (topbar) {
        topbar.style.display = "";
      }

      const navbar = document.querySelector("[data-navbar]") as HTMLElement;
      if (navbar) {
        navbar.style.display = "";
      }

      const categoryBar = document.querySelector(
        "[data-category-bar]",
      ) as HTMLElement;
      if (categoryBar) {
        categoryBar.style.display = "";
      }
    }

    return () => {
      // Cleanup
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Close with ESC key
  useEffect(() => {
    if (!isModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, handleClose]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Skip zoom on touch devices or if refs are missing
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
          className={`object-contain transition-opacity duration-300  ${
            showZoom && !isTouchDevice ? "opacity-0" : "opacity-100"
          }`}
          priority
        />

        {/* Zoom layer — only visible on desktop (when isTouchDevice is false) */}
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

      {/* Modal — Full screen overlay with maximum z-index */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          style={{
            zIndex: 999999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={handleClose}
        >
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 text-white hover:text-slate-300 transition-all duration-300 p-3 hover:bg-white/10 rounded-full group"
            style={{ zIndex: 1000000 }}
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

          {/* ESC key hint */}
          <div
            className="absolute hidden top-6 left-6 text-white/60 text-sm font-medium md:flex items-center gap-2"
            style={{ zIndex: 1000000 }}
          >
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
            <span>or click anywhere to close</span>
          </div>

          {/* Image Container */}
          <div className="relative w-[95vw] h-[95vh] flex items-center justify-center">
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
        </div>
      )}
    </>
  );
}
