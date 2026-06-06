// web/components/ui/ImageUploader.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  useCloudinaryUpload,
  UploadResult,
} from "@/hooks/use-cloudinary-upload";

interface ImageUploaderProps {
  label?: string;
  folder?: string;
  /** Existing image URL (initial value in edit mode) */
  initialUrl?: string;
  /** Called when upload is complete */
  onUpload: (result: UploadResult) => void;
  /** Called when image is removed */
  onRemove?: () => void;
  /** Accepted MIME types */
  accept?: string;
  /** Maximum file size (bytes, default 5MB) */
  maxBytes?: number;
  className?: string;
}

export default function ImageUploader({
  label,
  folder = "marketplace/products",
  initialUrl,
  onUpload,
  onRemove,
  accept = "image/png, image/jpeg, image/webp",
  maxBytes = 5 * 1024 * 1024,
  className = "",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    upload,
    progress,
    uploading,
    error: uploadError,
  } = useCloudinaryUpload();

  const handleFile = async (file: File) => {
    setLocalError(null);

    if (file.size > maxBytes) {
      setLocalError(
        `File too large — maximum ${Math.round(maxBytes / 1024 / 1024)} MB`,
      );
      return;
    }

    // Show instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const result = await upload(file, folder);
      URL.revokeObjectURL(objectUrl);
      setPreview(result.url);
      onUpload(result);
    } catch {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  const error = localError ?? uploadError;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      {preview ? (
        /* -- Preview card -- */
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("blob:")}
            // Line to be added:
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {/* Progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-3/4 bg-white/30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-sm font-medium">
                {progress}%
              </span>
            </div>
          )}
          {/* Remove button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        /* -- Drop zone -- */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="
            w-full h-44 rounded-xl border-2 border-dashed border-gray-300
            flex flex-col items-center justify-center gap-2
            cursor-pointer hover:border-blue-400 hover:bg-blue-50
            transition-colors
          "
        >
          <span className="text-3xl">🖼️</span>
          <p className="text-sm text-gray-500">
            Drag and drop or{" "}
            <span className="text-blue-500 font-medium">click</span>
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, WEBP · Max {Math.round(maxBytes / 1024 / 1024)} MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
