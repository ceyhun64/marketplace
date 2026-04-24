"use client";

import { useState } from "react";
import Image from "next/image";
import { useUpdateStoreSettings, useSetStoreDomain } from "@/queries/useStore";
import ImageUploader from "@/components/ui/imageUploader";
import type { MerchantProfile } from "@/types/entities";
import {
  CheckCircle2,
  Globe,
  Store,
  Clock,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";

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
      setError(e?.response?.data?.message ?? "Could not be saved.");
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
      setError(e?.response?.data?.message ?? "Failed to save domain.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Branding ──────────────────────────────────────────────── */}
      <SettingsSection
        icon={<Store className="w-4 h-4" />}
        title="Store Branding"
        description="Your store's public identity shown to customers."
      >
        {/* Logo + Banner row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Logo */}
          <div className="space-y-2">
            <p className={labelCls}>Store Logo</p>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                {form.logoUrl ? (
                  <Image
                    src={form.logoUrl}
                    alt="logo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-300 select-none">
                    {store.storeName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <ImageUploader
                label="Upload"
                folder="marketplace/logos"
                onUpload={(r) => setForm((f) => ({ ...f, logoUrl: r.url }))}
              />
            </div>
          </div>

          {/* Banner */}
          <div className="space-y-2">
            <p className={labelCls}>Store Banner</p>
            {form.bannerUrl ? (
              <div className="relative h-14 rounded-2xl overflow-hidden border border-gray-200">
                <Image
                  src={form.bannerUrl}
                  alt="banner"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-14 rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="text-xs text-gray-400">No banner yet</span>
              </div>
            )}
            <ImageUploader
              label="Upload Banner"
              folder="marketplace/banners"
              onUpload={(r) => setForm((f) => ({ ...f, bannerUrl: r.url }))}
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Store Name */}
        <Field label="Store Name" required>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            className={inputCls}
            placeholder="My Awesome Store"
          />
        </Field>

        {/* Description */}
        <Field label="Description" hint="Optional — shown on your store page">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Tell customers what makes your store special..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        {error && <ErrorBox message={error} />}

        <SaveButton
          loading={updateSettings.isPending}
          saved={saved}
          onClick={handleSave}
        />
      </SettingsSection>

      {/* ── Operations ────────────────────────────────────────────── */}
      <SettingsSection
        icon={<Clock className="w-4 h-4" />}
        title="Operations"
        description="Configure handling times used in shipping estimates."
      >
        <Field label="Order Handling Time" hint="in hours">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="72"
              value={form.handlingHours}
              onChange={(e) =>
                setForm((f) => ({ ...f, handlingHours: e.target.value }))
              }
              className={`${inputCls} w-28 text-center`}
            />
            <span className="text-sm text-gray-400">hours per order</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Used to calculate estimated delivery dates. Default is 24 hours.
          </p>
        </Field>
      </SettingsSection>

      {/* ── Domain ────────────────────────────────────────────────── */}
      <SettingsSection
        icon={<Globe className="w-4 h-4" />}
        title="Domain"
        description="Connect a subdomain or your own custom domain."
        badge={
          store.domainVerified ? (
            <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          ) : undefined
        }
      >
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: true,  label: "Subdomain",    desc: "store.platform.com", plan: "PRO+" },
            { val: false, label: "Custom Domain", desc: "yourstore.com",      plan: "Enterprise" },
          ].map(({ val, label, desc, plan }) => {
            const active = domainForm.isSubdomain === val;
            return (
              <button
                key={String(val)}
                onClick={() => setDomainForm((f) => ({ ...f, isSubdomain: val }))}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  active
                    ? "border-blue-400 bg-blue-50/40 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-blue-700" : "text-gray-800"}`}>
                      {label}
                    </p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded ${
                      active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {plan}
                  </span>
                </div>
                {active && (
                  <CheckCircle2 className="absolute bottom-3 right-3 w-4 h-4 text-blue-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Domain input */}
        <Field label={domainForm.isSubdomain ? "Subdomain Name" : "Your Domain"}>
          <div className="flex">
            <input
              type="text"
              value={domainForm.domain}
              onChange={(e) =>
                setDomainForm((f) => ({ ...f, domain: e.target.value }))
              }
              placeholder={
                domainForm.isSubdomain ? "your-store-name" : "yourstore.com"
              }
              className={`${inputCls} ${
                domainForm.isSubdomain
                  ? "rounded-r-none border-r-0 focus:ring-0"
                  : ""
              }`}
            />
            {domainForm.isSubdomain && (
              <span className="inline-flex items-center border border-gray-200 rounded-r-xl bg-gray-50 px-3 text-sm text-gray-400 whitespace-nowrap">
                .platform.com
              </span>
            )}
          </div>
        </Field>

        {/* DNS instructions */}
        {!domainForm.isSubdomain && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-800">
              DNS Setup Required
            </p>
            <p className="text-xs text-amber-700">
              Add this CNAME record at your domain registrar:
            </p>
            <code className="block bg-white border border-amber-100 rounded-lg px-3 py-2 text-xs font-mono text-blue-600">
              @ → platform.com
            </code>
          </div>
        )}

        {error && <ErrorBox message={error} />}

        <button
          onClick={handleDomainSave}
          disabled={setDomain.isPending || !domainForm.domain.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {setDomain.isPending ? "Saving..." : "Save Domain"}
          {!setDomain.isPending && <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </SettingsSection>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function SettingsSection({
  icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
        {badge}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function SaveButton({
  loading,
  saved,
  onClick,
}: {
  loading: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 ${
        saved
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-gray-900 text-white hover:bg-gray-700"
      }`}
    >
      {loading ? (
        "Saving..."
      ) : saved ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Saved
        </>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

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
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
        {hint && (
          <span className="text-gray-400 font-normal text-xs">— {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const labelCls = "block text-sm font-medium text-gray-700";

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";
