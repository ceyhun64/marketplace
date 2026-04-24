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
    .min(2, "Store name must be at least 2 characters.")
    .max(80, "Maximum 80 characters."),
  slug: z
    .string()
    .min(2, "At least 2 characters.")
    .max(50, "Maximum 50 characters.")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens."),
  description: z.string().max(500, "Maximum 500 characters.").optional(),
  logoUrl: z
    .string()
    .url("Enter a valid URL.")
    .optional()
    .or(z.literal("")),
  latitude: z.number({ message: "Enter a number." }).min(-90).max(90),
  longitude: z.number({ message: "Enter a number." }).min(-180).max(180),
  handlingHours: z
    .number({ message: "Enter a number." })
    .int()
    .min(1, "Minimum 1 hour.")
    .max(168, "Maximum 168 hours (1 week)."),
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

  // Auto-generate slug from store name
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
          const msg = err instanceof Error ? err.message : "Store setup failed.";
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
      {/* Merchant info */}
      {merchantEmail && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Merchant:{" "}
          <span className="font-medium text-foreground">{merchantEmail}</span>
        </div>
      )}

      {/* Store basic info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Store Information</h3>
        </div>

        {/* Store Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">Store Name</label>
          <Input
            placeholder="e.g. Tech Store Pro"
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
              placeholder="tech-store-pro"
              {...register("slug")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Store URL path. Lowercase letters, numbers, and hyphens only.
          </p>
          <FieldError message={errors.slug?.message} />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Description (optional)
          </label>
          <Textarea
            placeholder="Brief store description..."
            className="resize-none"
            rows={3}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* Logo URL */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Logo URL (optional)
          </label>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input placeholder="https://..." {...register("logoUrl")} />
          </div>
          <p className="text-xs text-muted-foreground">
            Cloudinary URL recommended. Can be updated later in store settings.
          </p>
          <FieldError message={errors.logoUrl?.message} />
        </div>
      </div>

      <Separator />

      {/* Location & Shipping */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Location & Shipping</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Warehouse coordinates used for shipping time and ETA calculations.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Latitude */}
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Latitude</label>
            <Input
              type="number"
              step="any"
              {...register("latitude", { valueAsNumber: true })}
            />
            <FieldError message={errors.latitude?.message} />
          </div>

          {/* Longitude */}
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Longitude</label>
            <Input
              type="number"
              step="any"
              {...register("longitude", { valueAsNumber: true })}
            />
            <FieldError message={errors.longitude?.message} />
          </div>
        </div>

        {/* Handling Hours */}
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">
            Handling Time (hours)
          </label>
          <Input
            type="number"
            min={1}
            max={168}
            {...register("handlingHours", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            Time needed to pack and hand off to courier. Default: 24 hours.
          </p>
          <FieldError message={errors.handlingHours?.message} />
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Setup Store
      </Button>
    </form>
  );
}

export default StoreSetupForm;
