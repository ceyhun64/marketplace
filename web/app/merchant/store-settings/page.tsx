"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Store,
  Globe,
  MapPin,
  Image,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Crown,
  Zap,
} from "lucide-react";
import {useCloudinaryUpload} from "@/hooks/use-cloudinary-upload";

interface MerchantProfile {
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
}

export default function MerchantStoreSettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    latitude: "",
    longitude: "",
    handlingHours: "24",
  });

  const [domainForm, setDomainForm] = useState({
    customDomain: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get("/merchant/profile");
      return res.data;
    },
  });

  const profile: MerchantProfile | null = data?.data || null;

  useEffect(() => {
    if (profile) {
      setForm({
        storeName: profile.storeName || "",
        description: profile.description || "",
        logoUrl: profile.logoUrl || "",
        bannerUrl: profile.bannerUrl || "",
        latitude: profile.latitude?.toString() || "",
        longitude: profile.longitude?.toString() || "",
        handlingHours: profile.handlingHours?.toString() || "24",
      });
      setDomainForm({ customDomain: profile.customDomain || "" });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.put("/merchant/profile", {
        ...payload,
        latitude: parseFloat(payload.latitude) || null,
        longitude: parseFloat(payload.longitude) || null,
        handlingHours: parseInt(payload.handlingHours) || 24,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Profil güncellendi");
      queryClient.invalidateQueries({ queryKey: ["merchant-profile"] });
    },
    onError: () => toast.error("Güncelleme başarısız"),
  });

  const setDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await api.post("/store/domain/set", { domain });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Domain kaydedildi. DNS doğrulama başlatılıyor...");
      queryClient.invalidateQueries({ queryKey: ["merchant-profile"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Domain kaydedilemedi");
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/store/domain/verify");
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.verified) {
        toast.success("Domain doğrulandı! ✓");
      } else {
        toast.error(
          "DNS kaydı henüz yayılmadı. Birkaç dakika sonra tekrar deneyin.",
        );
      }
      queryClient.invalidateQueries({ queryKey: ["merchant-profile"] });
    },
    onError: () => toast.error("Doğrulama isteği başarısız"),
  });

  const isPro = profile?.plan === "PRO" || profile?.plan === "ENTERPRISE";
  const isEnterprise = profile?.plan === "ENTERPRISE";

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mağaza Ayarları</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mağaza profili, görsel ve domain ayarları
          </p>
        </div>
        {profile?.slug && (
          <a
            href={`/store/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
          >
            Mağazayı Görüntüle
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Plan Banner */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          isEnterprise
            ? "bg-purple-50 border-purple-200"
            : isPro
              ? "bg-blue-50 border-blue-200"
              : "bg-gray-50 border-gray-200"
        }`}
      >
        {isEnterprise ? (
          <Crown className="w-5 h-5 text-purple-500 flex-shrink-0" />
        ) : isPro ? (
          <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
        ) : (
          <Store className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 text-sm">
          <span className="font-semibold text-gray-900">
            {profile?.plan || "BASIC"} Plan
          </span>
          {!isPro && (
            <span className="text-gray-500 ml-2">
              — Logo/banner ve subdomain için Pro plana geçin
            </span>
          )}
          {!isEnterprise && isPro && (
            <span className="text-gray-500 ml-2">
              — Özel domain için Enterprise plana geçin
            </span>
          )}
        </div>
        {!isEnterprise && (
          <a href="/merchant/subscription">
            <Button size="sm" variant="outline" className="text-xs">
              Planı Yükselt
            </Button>
          </a>
        )}
      </div>

      {/* Store Identity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-500" />
            Mağaza Profili
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Mağaza Adı</Label>
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, storeName: e.target.value }))
                }
                placeholder="Mağaza adınız"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-xs text-gray-400">/store/</span>
                <span className="text-sm font-medium text-blue-600">
                  {profile?.slug || "—"}
                </span>
              </div>
              <p className="text-xs text-gray-400">Slug değiştirilemez</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mağaza Açıklaması</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Mağazanız hakkında kısa bir açıklama..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className={`border-0 shadow-sm ${!isPro ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" />
            Logo & Banner
            {!isPro && (
              <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-normal">
                Pro Gerekli
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                disabled={!isPro}
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-14 w-14 object-contain rounded-lg border border-gray-200"
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
                disabled={!isPro}
              />
              {form.bannerUrl && (
                <img
                  src={form.bannerUrl}
                  alt="Banner"
                  className="h-14 w-full object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-500" />
            Domain Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Subdomain */}
          <div
            className={`rounded-lg border p-4 space-y-3 ${!isPro ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Özel Subdomain
                </p>
                <p className="text-xs text-gray-500">
                  mağazanız.platform.com formatında
                </p>
              </div>
              {!isPro && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  Pro Gerekli
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={
                  isPro && !isEnterprise
                    ? domainForm.customDomain
                    : profile?.slug
                      ? `${profile.slug}.platform.com`
                      : ""
                }
                onChange={(e) =>
                  setDomainForm({ customDomain: e.target.value })
                }
                placeholder={`${profile?.slug || "magaza"}.platform.com`}
                disabled={!isPro || isEnterprise}
              />
              {isPro && !isEnterprise && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDomainMutation.mutate(domainForm.customDomain)
                  }
                  disabled={setDomainMutation.isPending}
                >
                  Kaydet
                </Button>
              )}
            </div>
          </div>

          {/* Custom Domain */}
          <div
            className={`rounded-lg border p-4 space-y-3 ${!isEnterprise ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tam Özel Domain
                </p>
                <p className="text-xs text-gray-500">
                  mymağaza.com formatında kendi domaininizi bağlayın
                </p>
              </div>
              {!isEnterprise && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  Enterprise Gerekli
                </span>
              )}
            </div>
            {isEnterprise && (
              <>
                <div className="flex gap-2">
                  <Input
                    value={domainForm.customDomain}
                    onChange={(e) =>
                      setDomainForm({ customDomain: e.target.value })
                    }
                    placeholder="mymağaza.com"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDomainMutation.mutate(domainForm.customDomain)
                    }
                    disabled={setDomainMutation.isPending}
                  >
                    Kaydet
                  </Button>
                </div>

                {profile?.customDomain && (
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      profile.domainVerified
                        ? "bg-green-50 border border-green-200"
                        : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {profile.domainVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="font-medium">
                          {profile.customDomain}
                        </span>
                        <span
                          className={`text-xs ${
                            profile.domainVerified
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {profile.domainVerified
                            ? "Doğrulandı"
                            : "Doğrulanmadı"}
                        </span>
                      </div>
                      {!profile.domainVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => verifyDomainMutation.mutate()}
                          disabled={verifyDomainMutation.isPending}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Doğrula
                        </Button>
                      )}
                    </div>
                    {!profile.domainVerified && (
                      <p className="text-xs text-orange-600 mt-2">
                        DNS CNAME kaydınızı:{" "}
                        <span className="font-mono font-medium">
                          platform.com
                        </span>{" "}
                        adresine yönlendirin.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location & Fulfillment */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            Konum & Hazırlık Süresi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Enlem</Label>
              <Input
                id="lat"
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
              <Label htmlFor="lng">Boylam</Label>
              <Input
                id="lng"
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
          <p className="text-xs text-gray-400">
            Konum bilgisi kargo ETA hesabında kullanılır.
          </p>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Sipariş Hazırlık Süresi
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
                    {h} saat
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              Tahmini teslimat süresi hesabında siparişin kargoya verilmesi için
              gereken süre.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="min-w-36"
        >
          {updateMutation.isPending
            ? "Kaydediliyor..."
            : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
}
