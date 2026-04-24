"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Store,
  Globe,
  MapPin,
  Image,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface MerchantProfile {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  customDomain?: string;
  domainVerified: boolean;
  latitude?: number;
  longitude?: number;
  handlingHours: number;
  plan: string;
  isSuspended: boolean;
  email: string;
}

interface StoreSetupForm {
  storeName: string;
  slug: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  customDomain: string;
  latitude: string;
  longitude: string;
  handlingHours: string;
  plan: string;
}

export default function AdminMerchantStoreSetupPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;

  const [form, setForm] = useState<StoreSetupForm>({
    storeName: "",
    slug: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    customDomain: "",
    latitude: "",
    longitude: "",
    handlingHours: "24",
    plan: "BASIC",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-merchant-profile", merchantId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/merchants/${merchantId}`);
      return res.data;
    },
    enabled: !!merchantId,
  });

  const merchant: MerchantProfile | null = data?.data || null;

  useEffect(() => {
    if (merchant) {
      setForm({
        storeName: merchant.storeName || "",
        slug: merchant.slug || "",
        description: merchant.description || "",
        logoUrl: merchant.logoUrl || "",
        bannerUrl: merchant.bannerUrl || "",
        customDomain: merchant.customDomain || "",
        latitude: merchant.latitude?.toString() || "",
        longitude: merchant.longitude?.toString() || "",
        handlingHours: merchant.handlingHours?.toString() || "24",
        plan: merchant.plan || "BASIC",
      });
    }
  }, [merchant]);

  const setupMutation = useMutation({
    mutationFn: async (payload: StoreSetupForm) => {
      const res = await api.post(`/api/admin/store/${merchantId}/setup`, {
        ...payload,
        latitude: parseFloat(payload.latitude) || null,
        longitude: parseFloat(payload.longitude) || null,
        handlingHours: parseInt(payload.handlingHours) || 24,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Store configured successfully");
      router.push(`/admin/merchants`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Store setup failed");
    },
  });

  const handleSlugGenerate = () => {
    const slug = form.storeName
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName || !form.slug) {
      toast.error("Store name and slug are required");
      return;
    }
    setupMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/merchants")}
          className="text-gray-500"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Store Setup</h1>
          {merchant && (
            <p className="text-sm text-gray-500 mt-0.5">
              Configuring store for {merchant.email}
            </p>
          )}
        </div>
      </div>

      {/* Merchant Status Banner */}
      {merchant && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            merchant.isSuspended
              ? "bg-rose-50 border-rose-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          {merchant.isSuspended ? (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          )}
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {merchant.storeName || "New Store"}
            </p>
            <p className="text-gray-500">
              {merchant.email} · Plan:{" "}
              <span className="font-semibold">{merchant.plan || "BASIC"}</span>
              {merchant.isSuspended && (
                <span className="ml-2 text-rose-600 font-semibold">
                  (Suspended)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Store Identity */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Store Identity</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">
                  Store Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, storeName: e.target.value }))
                  }
                  placeholder="e.g. Tech Store Pro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL Slug <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="tech-store-pro"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSlugGenerate}
                    className="whitespace-nowrap text-xs"
                  >
                    Generate
                  </Button>
                </div>
                {form.slug && (
                  <p className="text-xs text-gray-400">
                    /store/
                    <span className="text-blue-600 font-medium">
                      {form.slug}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Store Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief store description..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Image className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-gray-900">Branding</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                }
                placeholder="https://res.cloudinary.com/..."
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="h-12 w-12 object-contain rounded border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner URL</Label>
              <Input
                id="bannerUrl"
                value={form.bannerUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bannerUrl: e.target.value }))
                }
                placeholder="https://res.cloudinary.com/..."
              />
              {form.bannerUrl && (
                <img
                  src={form.bannerUrl}
                  alt="Banner preview"
                  className="h-12 w-full object-cover rounded border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Domain */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-900">Domain Settings</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain / Subdomain</Label>
            <Input
              id="customDomain"
              value={form.customDomain}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  customDomain: e.target.value,
                }))
              }
              placeholder="store.platform.com or mycustomstore.com"
            />
            <p className="text-xs text-gray-400">
              Subdomain (Pro) or custom domain (Enterprise) — plan requirements apply.
            </p>
          </div>
        </div>

        {/* Location & Fulfillment */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Location & Fulfillment</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, latitude: e.target.value }))
                  }
                  placeholder="41.0082"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, longitude: e.target.value }))
                  }
                  placeholder="28.9784"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="handlingHours" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Handling Time (hours)
              </Label>
              <Select
                value={form.handlingHours}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, handlingHours: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 8, 12, 24, 48, 72].map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Subscription Plan</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["BASIC", "PRO", "ENTERPRISE"] as const).map((plan) => (
              <label
                key={plan}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.plan === plan
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={form.plan === plan}
                  onChange={() => setForm((prev) => ({ ...prev, plan }))}
                  className="sr-only"
                />
                <p className="text-sm font-semibold text-gray-900">{plan}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {plan === "BASIC"
                    ? "Free · 50 products"
                    : plan === "PRO"
                      ? "$X/mo · Unlimited"
                      : "Custom pricing"}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/merchants")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={setupMutation.isPending}
            className="min-w-32 bg-gray-900 hover:bg-gray-800"
          >
            {setupMutation.isPending ? "Saving..." : "Save Store"}
          </Button>
        </div>
      </form>
    </div>
  );
}
