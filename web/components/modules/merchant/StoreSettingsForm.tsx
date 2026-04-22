"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUpdateStoreSettings, useSetStoreDomain } from "@/queries/useStore";
import ImageUploader from "@/components/ui/imageUploader";
import type { MerchantProfile } from "@/types/entities";

interface Props {
  store: MerchantProfile;
}

export default function StoreSettingsForm({ store }: Props) {
  const updateSettings = useUpdateStoreSettings();
  const setDomain = useSetStoreDomain();

  const [form, setForm] = useState({
    storeName: store.storeName ?? "",
    description: store.description ?? "",
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
    handlingHours: String(store.handlingHours ?? 24),
  });

  const [domainForm, setDomainForm] = useState({
    domain: store.customDomain ?? "",
    isSubdomain:
      !store.customDomain?.includes(".") ||
      store.customDomain?.endsWith(".platform.com"),
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    try {
      await updateSettings.mutateAsync({
        storeName: form.storeName.trim(),
        description: form.description.trim(),
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        handlingHours: Number(form.handlingHours),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Kaydedilemedi.");
    }
  };

  const handleDomainSave = async () => {
    setError(null);
    try {
      await setDomain.mutateAsync({
        domain: domainForm.domain.trim(),
        isSubdomain: domainForm.isSubdomain,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Domain kaydedilemedi.");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Temel Bilgiler */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#0D0D0D]">Mağaza Bilgileri</h3>
          <p className="text-xs text-[#7A7060] mt-0.5 font-mono">
            Müşterilerin gördüğü bilgiler
          </p>
        </div>
        <div className="p-6 space-y-5">
          {/* Logo */}
          <div>
            <p className="text-sm font-medium text-[#0D0D0D] mb-2">
              Mağaza Logosu
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {form.logoUrl ? (
                  <Image
                    src={form.logoUrl}
                    alt="logo"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl">{store.storeName.charAt(0)}</span>
                )}
              </div>
              <ImageUploader
                label="Logo Yükle"
                folder="marketplace/logos"
                onUpload={(result) =>
                  setForm((f) => ({ ...f, logoUrl: result.url }))
                }
              />
            </div>
          </div>

          {/* Banner */}
          <div>
            <p className="text-sm font-medium text-[#0D0D0D] mb-2">
              Mağaza Banner'ı
            </p>
            {form.bannerUrl && (
              <div className="relative h-24 rounded-xl overflow-hidden mb-2 border border-gray-200">
                <Image
                  src={form.bannerUrl}
                  alt="banner"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <ImageUploader
              label="Banner Yükle"
              folder="marketplace/banners"
              onUpload={(result) =>
                setForm((f) => ({ ...f, bannerUrl: result.url }))
              }
            />
          </div>

          {/* Mağaza Adı */}
          <Field label="Mağaza Adı" required>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) =>
                setForm((f) => ({ ...f, storeName: e.target.value }))
              }
              className={inputCls}
            />
          </Field>

          {/* Açıklama */}
          <Field label="Açıklama">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mağazanız hakkında kısa bir açıklama..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Hazırlık Süresi */}
          <Field label="Sipariş Hazırlık Süresi" hint="saat cinsinden">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="72"
                value={form.handlingHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, handlingHours: e.target.value }))
                }
                className={`${inputCls} w-28`}
              />
              <span className="text-sm text-[#7A7060]">saat</span>
            </div>
            <p className="text-xs text-[#7A7060] mt-1">
              ETA hesaplamalarında kullanılır. Varsayılan: 24 saat.
            </p>
          </Field>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="bg-[#0D0D0D] text-[#F5F2EB] rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-[#C84B2F] disabled:opacity-50 transition-colors"
          >
            {updateSettings.isPending
              ? "Kaydediliyor..."
              : saved
                ? "✓ Kaydedildi"
                : "Kaydet"}
          </button>
        </div>
      </section>

      {/* Domain Ayarları */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#0D0D0D]">Domain Ayarları</h3>
            {store.domainVerified && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Doğrulandı
              </span>
            )}
          </div>
          <p className="text-xs text-[#7A7060] mt-0.5 font-mono">
            Özel domain veya subdomain bağlayın
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Tür seçimi */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                val: true,
                label: "Subdomain",
                desc: "mağaza.platform.com",
                plan: "PRO+",
              },
              {
                val: false,
                label: "Özel Domain",
                desc: "mymağaza.com",
                plan: "Enterprise",
              },
            ].map(({ val, label, desc, plan }) => (
              <button
                key={String(val)}
                onClick={() =>
                  setDomainForm((f) => ({ ...f, isSubdomain: val }))
                }
                className={`p-4 rounded-xl border text-left transition-all ${
                  domainForm.isSubdomain === val
                    ? "border-[#1A4A6B] bg-[#1A4A6B]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-[#0D0D0D]">
                    {label}
                  </span>
                  <span className="font-mono text-[9px] text-[#1A4A6B] bg-[#1A4A6B]/10 px-1.5 py-0.5 rounded">
                    {plan}
                  </span>
                </div>
                <span className="text-xs text-[#7A7060] font-mono">{desc}</span>
              </button>
            ))}
          </div>

          {/* Domain input */}
          <Field
            label={domainForm.isSubdomain ? "Subdomain Adı" : "Domain Adresi"}
          >
            <div className="flex items-center">
              <input
                type="text"
                value={domainForm.domain}
                onChange={(e) =>
                  setDomainForm((f) => ({ ...f, domain: e.target.value }))
                }
                placeholder={
                  domainForm.isSubdomain ? "maganizin-adi" : "maganizin.com"
                }
                className={`${inputCls} ${domainForm.isSubdomain ? "rounded-r-none border-r-0" : ""}`}
              />
              {domainForm.isSubdomain && (
                <div className="border border-gray-200 border-l-0 rounded-r-lg px-3 py-2 bg-gray-50 text-sm text-[#7A7060] whitespace-nowrap">
                  .platform.com
                </div>
              )}
            </div>
          </Field>

          {!domainForm.isSubdomain && (
            <div className="bg-[#F5F2EB] rounded-xl p-4 text-xs text-[#7A7060] space-y-1">
              <p className="font-semibold text-[#0D0D0D]">DNS Ayarı Gerekli</p>
              <p>Domain sağlayıcınızda şu CNAME kaydını ekleyin:</p>
              <code className="block bg-white rounded px-2 py-1 font-mono text-[#1A4A6B] mt-1">
                @ → platform.com
              </code>
            </div>
          )}

          <button
            onClick={handleDomainSave}
            disabled={setDomain.isPending || !domainForm.domain.trim()}
            className="bg-[#1A4A6B] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-[#1A4A6B]/80 disabled:opacity-50 transition-colors"
          >
            {setDomain.isPending ? "Kaydediliyor..." : "Domain Kaydet"}
          </button>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4A6B]/30 focus:border-[#1A4A6B] transition-colors";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-[#0D0D0D] mb-1.5">
        {label}
        {required && <span className="text-[#C84B2F]">*</span>}
        {hint && (
          <span className="text-[#7A7060] font-normal text-xs">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}
