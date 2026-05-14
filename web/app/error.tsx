"use client";

// app/error.tsx — Uygulama geneli hata sınırı (Next.js App Router)
// Beklenmedik runtime hatalarını yakalar ve kullanıcıya dostu bir arayüz sunar.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Hata izleme servisi (Sentry vb.) buraya entegre edilebilir.
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* İkon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        {/* Başlık */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Bir hata oluştu
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Beklenmedik bir sorun yaşandı. Lütfen sayfayı yenileyin ya da ana
            sayfaya dönün.
          </p>
        </div>

        {/* Hata detayı (sadece geliştirme ortamında) */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Aksiyon butonları */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="default"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Button>
        </div>

        {/* Destek linki */}
        <p className="text-xs text-muted-foreground">
          Sorun devam ediyorsa{" "}
          <a
            href="/contact"
            className="underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-0.5"
          >
            destek ekibimize ulaşın
            <ChevronRight className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
