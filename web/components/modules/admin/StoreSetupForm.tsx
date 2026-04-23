"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Store, Globe, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAdminSetupStore } from "@/queries/useAdmin";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  storeName: z
    .string()
    .min(2, "Mağaza adı en az 2 karakter olmalı.")
    .max(80, "En fazla 80 karakter."),
  slug: z
    .string()
    .min(2, "En az 2 karakter.")
    .max(50, "En fazla 50 karakter.")
    .regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir."),
  description: z.string().max(500, "En fazla 500 karakter.").optional(),
  logoUrl: z
    .string()
    .url("Geçerli bir URL girin.")
    .optional()
    .or(z.literal("")),
  latitude: z.number({ message: "Sayı girin." }).min(-90).max(90),
  longitude: z.number({ message: "Sayı girin." }).min(-180).max(180),
  handlingHours: z
    .number({ message: "Sayı girin." })
    .int()
    .min(1, "En az 1 saat.")
    .max(168, "En fazla 168 saat (1 hafta)."),
});

type FormValues = z.infer<typeof schema>;

// ── Helper: inline field error ────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive mt-1">{message}</p>;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface StoreSetupFormProps {
  merchantId: string;
  merchantEmail?: string;
  className?: string;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StoreSetupForm({
  merchantId,
  merchantEmail,
  className,
  onSuccess,
}: StoreSetupFormProps) {
  const router = useRouter();
  const { mutate: setupStore, isPending } = useAdminSetupStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: "",
      slug: "",
      description: "",
      logoUrl: "",
      latitude: 41.015137,
      longitude: 28.97953,
      handlingHours: 24,
    },
  });

  // Mağaza adından otomatik slug üret
  function handleStoreNameBlur(name: string) {
    if (getValues("slug")) return;
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    setServerError(null);
    setupStore(
      {
        merchantId,
        body: {
          storeName: values.storeName,
          slug: values.slug,
          description: values.description,
          logoUrl: values.logoUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          router.push("/admin/merchants");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Mağaza kurulamadı.";
          setServerError(msg);
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* Merchant bilgisi */}
      {merchantEmail && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Satıcı:{" "}
          <span className="font-medium text-foreground">{merchantEmail}</span>
        </div>
      )}

      {/* Mağaza temel bilgileri */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Mağaza Bilgileri</h3>
        </div>

        {/* Mağaza Adı */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">Mağaza Adı</label>
          <Input
            placeholder="Örn: Ahmet'in Butik Çarşısı"
            {...register("storeName")}
            onBlur={(e) => handleStoreNameBlur(e.target.value)}
          />
          <FieldError message={errors.storeName?.message} />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">URL Slug</label>
          <div className="flex items-center">
            <span className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-xs text-muted-foreground">
              /store/
            </span>
            <Input
              className="rounded-l-none"
              placeholder="ahmet-butik"
              {...register("slug")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Mağazanın URL adresi. Sadece küçük harf, rakam ve tire.
          </p>
          <FieldError message={errors.slug?.message} />
        </div>

        {/* Açıklama */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Açıklama (isteğe bağlı)
          </label>
          <Textarea
            placeholder="Mağaza hakkında kısa bir açıklama…"
            className="resize-none"
            rows={3}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* Logo URL */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Logo URL (isteğe bağlı)
          </label>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input placeholder="https://…" {...register("logoUrl")} />
          </div>
          <p className="text-xs text-muted-foreground">
            Cloudinary URL'si önerilir. Sonradan mağaza ayarlarından da
            değiştirilebilir.
          </p>
          <FieldError message={errors.logoUrl?.message} />
        </div>
      </div>

      <Separator />

      {/* Konum & Kargo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Konum & Kargo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Kargo süresi ve ETA hesaplaması için satıcı deposunun koordinatları
          kullanılır.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Enlem */}
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Enlem</label>
            <Input
              type="number"
              step="any"
              {...register("latitude", { valueAsNumber: true })}
            />
            <FieldError message={errors.latitude?.message} />
          </div>

          {/* Boylam */}
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Boylam</label>
            <Input
              type="number"
              step="any"
              {...register("longitude", { valueAsNumber: true })}
            />
            <FieldError message={errors.longitude?.message} />
          </div>
        </div>

        {/* Hazırlık Süresi */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Hazırlık Süresi (saat)
          </label>
          <Input
            type="number"
            min={1}
            max={168}
            {...register("handlingHours", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            Siparişin paketlenip kargoya verilmesi için gereken süre.
            Varsayılan: 24 saat.
          </p>
          <FieldError message={errors.handlingHours?.message} />
        </div>
      </div>

      {/* Sunucu hatası */}
      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Mağazayı Kur
      </Button>
    </form>
  );
}

export default StoreSetupForm;
