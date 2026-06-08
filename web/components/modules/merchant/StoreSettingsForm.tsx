"use client";

import { useState } from "react";
import {
  useUpdateStoreSettings,
  useSetStoreDomain,
  useVerifyDomain,
} from "@/queries/useStore";
import ImageUploader from "@/components/ui/imageUploader";
import type { MerchantProfile } from "@/types/entities";
import {
  CheckCircle2,
  Globe,
  Store,
  Clock,
  BadgeCheck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const PLATFORM_SUFFIX = ".platform.com";

interface Props {
  store: MerchantProfile;
}

export default function StoreSettingsForm({ store }: Props) {
  const updateSettings = useUpdateStoreSettings();
  const setDomain = useSetStoreDomain();
  const verifyDomain = useVerifyDomain();

  const [form, setForm] = useState({
    storeName: store.storeName ?? "",
    description: store.description ?? "",
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
    handlingHours: String(store.handlingHours ?? 24),
  });

  const initialIsSubdomain =
    !store.customDomain ||
    !store.customDomain.includes(".") ||
    store.customDomain.endsWith(PLATFORM_SUFFIX);

  const [domainForm, setDomainForm] = useState({
    domain: initialIsSubdomain
      ? (store.customDomain ?? "").replace(PLATFORM_SUFFIX, "")
      : (store.customDomain ?? ""),
    isSubdomain: initialIsSubdomain,
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    message?: string;
    dnsRecord?: { type: string; host: string; value: string; ttl?: number };
  } | null>(null);

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
    setVerifyResult(null);
    try {
      const raw = domainForm.domain.trim();
      const fullDomain = domainForm.isSubdomain
        ? `${raw}${PLATFORM_SUFFIX}`
        : raw;
      await setDomain.mutateAsync({ domain: fullDomain });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save domain.");
    }
  };

  const handleVerifyDomain = async () => {
    setError(null);
    try {
      const { data } = await verifyDomain.mutateAsync();
      setVerifyResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Domain verification failed.");
    }
  };

  return (
    <div className="space-y-6 ">
      {/* -- Branding ------------------------------------------------ */}
      <SettingsSection
        icon={<Store className="w-4 h-4" />}
        title="Store Branding"
        description="Your store's public identity shown to customers."
      >
        {/* Logo + Banner row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ImageUploader
            label="Store Logo"
            folder="marketplace/logos"
            initialUrl={form.logoUrl}
            onUpload={(r) => setForm((f) => ({ ...f, logoUrl: r.url }))}
            onRemove={() => setForm((f) => ({ ...f, logoUrl: "" }))}
          />
          <ImageUploader
            label="Store Banner"
            folder="marketplace/banners"
            initialUrl={form.bannerUrl}
            onUpload={(r) => setForm((f) => ({ ...f, bannerUrl: r.url }))}
            onRemove={() => setForm((f) => ({ ...f, bannerUrl: "" }))}
          />
        </div>

        <hr className="border-(--border-light)" />

        {/* Store Name */}
        <Field label="Store Name" required>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) =>
              setForm((f) => ({ ...f, storeName: e.target.value }))
            }
            className={inputCls}
            placeholder="My Awesome Store"
          />
        </Field>

        {/* Description */}
        <Field label="Description" hint="Optional — shown on your store page">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
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

      {/* -- Operations ---------------------------------------------- */}
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
            <span className="text-sm text-(--text-tertiary)">hours per order</span>
          </div>
          <p className="text-xs text-(--text-tertiary) mt-1.5">
            Used to calculate estimated delivery dates. Default is 24 hours.
          </p>
        </Field>
      </SettingsSection>

      {/* -- Domain -------------------------------------------------- */}
      <SettingsSection
        icon={<Globe className="w-4 h-4" />}
        title="Domain"
        description="Connect a subdomain or your own custom domain."
        badge={
          store.domainVerified ? (
            <span className="flex items-center gap-1 text-xs bg-(--success-bg) text-(--success) border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          ) : undefined
        }
      >
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              val: true,
              label: "Subdomain",
              desc: "store.platform.com",
              plan: "PRO+",
            },
            {
              val: false,
              label: "Custom Domain",
              desc: "yourstore.com",
              plan: "Enterprise",
            },
          ].map(({ val, label, desc, plan }) => {
            const active = domainForm.isSubdomain === val;
            return (
              <button
                key={String(val)}
                onClick={() =>
                  setDomainForm((f) => ({ ...f, isSubdomain: val }))
                }
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  active
                    ? "border-blue-400 bg-(--info-bg)/40 shadow-sm"
                    : "border-(--border-mid) hover:border-(--border-mid) bg-(--bg-surface)"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-sm font-semibold ${active ? "text-(--info)" : "text-(--text-primary)"}`}
                    >
                      {label}
                    </p>
                    <p className="text-xs font-mono text-(--text-tertiary) mt-0.5">
                      {desc}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded ${
                      active
                        ? "bg-(--info-bg) text-(--info)"
                        : "bg-(--off-white-2) text-(--text-secondary)"
                    }`}
                  >
                    {plan}
                  </span>
                </div>
                {active && (
                  <CheckCircle2 className="absolute bottom-3 right-3 w-4 h-4 text-(--info)" />
                )}
              </button>
            );
          })}
        </div>

        {/* Domain input */}
        <Field
          label={domainForm.isSubdomain ? "Subdomain Name" : "Your Domain"}
        >
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
              <span className="inline-flex items-center border border-(--border-mid) rounded-r-xl bg-(--bg-sunken) px-3 text-sm text-(--text-tertiary) whitespace-nowrap">
                .platform.com
              </span>
            )}
          </div>
        </Field>

        {/* DNS instructions */}
        {!domainForm.isSubdomain && (
          <div className="rounded-xl border border-amber-100 bg-(--warning-bg) p-4 space-y-2">
            <p className="text-xs font-semibold text-(--warning)">
              DNS Setup Required
            </p>
            <p className="text-xs text-(--warning)">
              Add this CNAME record at your domain registrar:
            </p>
            <code className="block bg-(--bg-surface) border border-amber-100 rounded-lg px-3 py-2 text-xs font-mono text-(--info)">
              @ → platform.com
            </code>
          </div>
        )}

        {error && <ErrorBox message={error} />}

        <button
          onClick={handleDomainSave}
          disabled={setDomain.isPending || !domainForm.domain.trim()}
          className="flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: "var(--red)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--red-dark)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--red)")
          }
        >
          {setDomain.isPending ? "Saving..." : "Save Domain"}
          {!setDomain.isPending && <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Verification */}
        {store.customDomain && !store.domainVerified && (
          <div className="rounded-xl border border-(--border-mid) bg-(--bg-sunken) p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-(--text-primary)">
                  Domain not verified yet
                </p>
                <p className="text-xs text-(--text-tertiary) mt-0.5">
                  {store.customDomain.endsWith(PLATFORM_SUFFIX)
                    ? "Verify your subdomain to activate it."
                    : "Add the DNS record below, then verify ownership."}
                </p>
              </div>
              <button
                onClick={handleVerifyDomain}
                disabled={verifyDomain.isPending}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-(--border-mid) bg-(--bg-surface) text-(--text-primary) hover:border-(--info) hover:text-(--info) transition-all disabled:opacity-40"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {verifyDomain.isPending ? "Verifying..." : "Verify Domain"}
              </button>
            </div>

            {verifyResult && (
              <div
                className={`rounded-lg border p-3 text-xs space-y-2 ${
                  verifyResult.verified
                    ? "border-emerald-100 bg-(--success-bg) text-(--success)"
                    : "border-amber-100 bg-(--warning-bg) text-(--warning)"
                }`}
              >
                <p className="font-medium">{verifyResult.message}</p>
                {verifyResult.dnsRecord && (
                  <code className="block bg-(--bg-surface) border border-(--border-mid) rounded-lg px-3 py-2 font-mono text-(--info)">
                    {verifyResult.dnsRecord.type} {verifyResult.dnsRecord.host}{" "}
                    → {verifyResult.dnsRecord.value}
                  </code>
                )}
              </div>
            )}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

// -- Shared sub-components ------------------------------------------------------

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
    <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-(--border-light) bg-(--bg-sunken)/60">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-lg bg-(--bg-surface) border border-(--border-mid) text-(--text-secondary) shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
            <p className="text-xs text-(--text-tertiary) mt-0.5">{description}</p>
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
          ? "bg-(--success-bg) text-(--success) border border-(--success-border)"
          : "text-white"
      }`}
      style={!saved ? { background: "var(--red)" } : {}}
      onMouseEnter={(e) => {
        if (!saved)
          (e.currentTarget as HTMLElement).style.background = "var(--red-dark)";
      }}
      onMouseLeave={(e) => {
        if (!saved)
          (e.currentTarget as HTMLElement).style.background = "var(--red)";
      }}
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-(--text-secondary)">
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
        {hint && (
          <span className="text-(--text-tertiary) font-normal text-xs">— {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const labelCls = "block text-sm font-medium text-(--text-secondary)";

const inputCls =
  "w-full border border-(--border-mid) rounded-xl px-3 py-2.5 text-sm bg-(--bg-surface) placeholder:text-(--text-tertiary) focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";
