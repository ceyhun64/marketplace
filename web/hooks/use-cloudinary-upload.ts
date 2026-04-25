"use client";

import { useState, useCallback } from "react";

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

interface UseCloudinaryUploadReturn {
  upload: (file: File, folder?: string) => Promise<UploadResult>;
  progress: number;
  uploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(
    (file: File, folder = "marketplace"): Promise<UploadResult> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          setUploading(false);
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            const msg = "Upload failed";
            setError(msg);
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          const msg = "Ağ hatası — dosya yüklenemedi";
          setError(msg);
          reject(new Error(msg));
        };

        setUploading(true);
        setError(null);
        setProgress(0);
        xhr.open("POST", "/api/upload"); // ← kendi route'umuz
        xhr.send(formData);
      });
    },
    [],
  );

  return { upload, progress, uploading, error, reset };
}
