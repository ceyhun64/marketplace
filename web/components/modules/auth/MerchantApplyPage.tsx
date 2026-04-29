"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Store, CheckCircle2 } from "lucide-react";
import PhoneInput from "@/components/ui/phone-input";
import PasswordInput from "@/components/ui/password-input";

export default function MerchantApplyPage() {
  const router = useRouter();
  const { applyMerchant, isLoading, error, clearError } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    storeName: "",
    slug: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // storeName değişince slug'ı otomatik üret
      ...(name === "storeName"
        ? {
            slug: value
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          }
        : {}),
    }));
    clearError();
    setValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setValidationError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setValidationError(
        "Password must contain at least one uppercase letter and one number.",
      );
      return;
    }
    if (!form.slug) {
      setValidationError("Store URL slug is required.");
      return;
    }
    try {
      await applyMerchant({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        storeName: form.storeName,
        slug: form.slug,
        description: form.description || undefined,
      });
      setSubmitted(true);
    } catch {
      // error handled via store
    }
  };

  const displayError = validationError || error;

  // ── Başvuru tamamlandı ekranı ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
        </div>
        <div className="w-full max-w-[480px] relative">
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-heading font-normal text-[var(--charcoal)] mb-3">
              Application Received
            </h1>
            <p className="text-[var(--charcoal-soft)] text-sm leading-relaxed mb-8">
              Your merchant application for{" "}
              <span className="font-semibold text-[var(--charcoal)]">
                {form.storeName}
              </span>{" "}
              has been submitted. Our team will review it and notify you at{" "}
              <span className="font-semibold text-[var(--charcoal)]">
                {form.email}
              </span>
              .
            </p>
            <p className="text-xs text-[var(--charcoal-soft)] opacity-60 mb-8 font-mono uppercase tracking-[2px]">
              Approval typically takes 1–2 business days
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors group"
            >
              Back to Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Başvuru formu ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-14">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[var(--red)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-[var(--charcoal-mid)]/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-[580px] relative">
        <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--charcoal)] flex items-center justify-center mx-auto mb-4">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-normal text-[var(--charcoal)] mb-3">
              Become a Merchant
            </h1>
            <p className="text-[var(--charcoal-soft)] text-sm">
              Fill in your details below. Your application will be reviewed by
              our team before activation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
              <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                {displayError}
              </div>
            )}

            {/* ── Kişisel Bilgiler ── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] mb-3">
                Personal Details
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                      First Name *
                    </Label>
                    <Input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="John"
                      className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                      Last Name *
                    </Label>
                    <Input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Smith"
                      className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                    Email *
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                    Phone
                  </Label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v ?? "" }))}
                    defaultCountry="TR"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                      Password *
                    </Label>
                    <PasswordInput
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                      Confirm *
                    </Label>
                    <PasswordInput
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-black/[0.04]" />

            {/* ── Mağaza Bilgileri ── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] mb-3">
                Store Details
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                    Store Name *
                  </Label>
                  <Input
                    name="storeName"
                    value={form.storeName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Tech Bazaar"
                    className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                    Store URL *
                  </Label>
                  <div className="flex items-center gap-0 h-12 rounded-xl border border-black/[0.05] bg-white/50 overflow-hidden focus-within:bg-white transition-all">
                    <span className="px-4 text-xs text-[var(--charcoal-soft)] bg-black/[0.02] border-r border-black/[0.05] h-full flex items-center whitespace-nowrap font-mono">
                      /store/
                    </span>
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      required
                      placeholder="tech-bazaar"
                      className="flex-1 px-3 bg-transparent text-sm outline-none text-[var(--charcoal)] placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[var(--charcoal-soft)] ml-1">
                    Description
                  </Label>
                  <Input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Short description about your store..."
                    className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[var(--charcoal)] hover:bg-[var(--red)] text-white rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all group mt-2 shadow-lg shadow-black/5"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Submit Application
                  <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/[0.03] text-center">
            <p className="text-sm text-[var(--charcoal-soft)]">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[var(--charcoal)] font-bold hover:text-[var(--red)] transition-colors inline-flex items-center gap-1 group"
              >
                Sign in
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
            <p className="text-sm text-[var(--charcoal-soft)] mt-2">
              Want a customer account?{" "}
              <Link
                href="/auth/register"
                className="text-[var(--charcoal)] font-bold hover:text-[var(--red)] transition-colors inline-flex items-center gap-1 group"
              >
                Register here
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[var(--charcoal-soft)] font-mono uppercase tracking-[3px] opacity-50">
          Applications reviewed within 1–2 business days
        </p>
      </div>
    </div>
  );
}
