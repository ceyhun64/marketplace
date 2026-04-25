"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  useCloudinaryUpload,
  UploadResult,
} from "@/hooks/use-cloudinary-upload";

interface MultiImageUploaderProps {
  label?: string;
  folder?: string;
  initialUrls?: string[];
  maxFiles?: number;
  onUpdate: (urls: string[]) => void;
}

interface UploadedImage {
  url: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

export default function MultiImageUploader({
  label,
  folder = "marketplace/products",
  initialUrls = [],
  maxFiles = 5,
  onUpdate,
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialUrls.map((url) => ({ url })),
  );
  const { upload } = useCloudinaryUpload();

  // ✅ onUpdate'i render dışında, effect içinde çağır
  useEffect(() => {
    const anyUploading = images.some((img) => img.uploading);
    if (anyUploading) return; // yükleme bitene kadar bekleme

    const urls = images.filter((img) => img.url).map((img) => img.url);
    onUpdate(urls);
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files: FileList) => {
    const remaining = maxFiles - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    const placeholders: UploadedImage[] = toUpload.map((f) => ({
      url: URL.createObjectURL(f),
      uploading: true,
      progress: 0,
    }));

    setImages((prev) => [...prev, ...placeholders]);

    const results = await Promise.allSettled(
      toUpload.map((file) => upload(file, folder)),
    );

    setImages((prev) => {
      const updated = [...prev];
      const startIdx = updated.length - toUpload.length;
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          updated[startIdx + i] = { url: result.value.url };
        } else {
          updated[startIdx + i] = { url: "", error: "Upload failed" };
        }
      });
      return updated.filter((img) => img.url !== "");
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group"
          >
            {img.url && (
              <Image
                src={img.url}
                alt={`Görsel ${i + 1}`}
                fill
                className="object-cover"
                unoptimized={img.url.startsWith("blob:")}
                // Addnecek satır:
                sizes="96px"
              />
            )}
            {img.uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {img.progress ?? 0}%
                </span>
              </div>
            )}
            {!img.uploading && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            )}
            {img.error && (
              <div className="absolute inset-0 bg-red-100 flex items-center justify-center p-1">
                <span className="text-red-500 text-xs text-center">
                  {img.error}
                </span>
              </div>
            )}
          </div>
        ))}

        {images.length < maxFiles && (
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-400">
            <span className="text-2xl">+</span>
            <span className="text-xs">Add</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {images.length}/{maxFiles} görsel · PNG, JPG, WEBP
      </p>
    </div>
  );
}
