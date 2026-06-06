"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Store, CheckCircle2 } from "lucide-react";
import PhoneInput from "@/components/ui/phone-input";
import PasswordInput from "@/components/ui/password-input";
import AuthSplitLayout from "./AuthSplitLayout";

export default function MerchantApplyPage() {
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

  // -- Başvuru tamamlandı ekranı ---------------------------------------------
  if (submitted) {
    return (
      <AuthSplitLayout variant="merchant" wide>
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-(--success-bg) border border-(--success-border) flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-(--success)" />
          </div>
          <h1 className="font-heading text-[2rem] font-normal text-(--charcoal) mb-3 tracking-tight">
            Application Received
          </h1>
          <p className="text-(--charcoal-soft) text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Your merchant application for{" "}
            <span className="font-semibold text-(--charcoal)">{form.storeName}</span>{" "}
            has been submitted. Our team will review it and notify you at{" "}
            <span className="font-semibold text-(--charcoal)">{form.email}</span>.
          </p>
          <p className="font-mono text-xs text-(--charcoal-soft) opacity-60 mb-8 uppercase tracking-[2px]">
            Approval typically takes 1–2 business days
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-(--charcoal) hover:text-(--red) transition-colors group"
          >
            Back to Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  // -- Başvuru formu ---------------------------------------------------------
  return (
    <AuthSplitLayout variant="merchant" wide>
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-(--charcoal) flex items-center justify-center mx-auto mb-4">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-[clamp(1.75rem,3.5vw,2.25rem)] font-normal text-(--charcoal) mb-2 tracking-tight">
            Become a Merchant
          </h1>
          <p className="text-(--charcoal-soft) text-sm">
            Fill in your details below. Your application will be reviewed before activation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {displayError && (
            <div className="px-4 py-3.5 bg-(--danger-bg) border border-(--danger-border) rounded-2xl text-[13px] text-(--danger) font-medium animate-in fade-in slide-in-from-top-1">
              {displayError}
            </div>
          )}

          {/* -- Kişisel Bilgiler -- */}
          <div className="space-y-4">
            <p className="label-mono">Personal Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label-mono ml-1">First Name *</label>
                <Input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="label-mono ml-1">Last Name *</label>
                <Input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Smith"
                  className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-mono ml-1">Email *</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono ml-1">Phone</label>
              <PhoneInput
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v ?? "" }))}
                defaultCountry="TR"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label-mono ml-1">Password *</label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="label-mono ml-1">Confirm *</label>
                <PasswordInput
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-(--border-light)" />

          {/* -- Mağaza Bilgileri -- */}
          <div className="space-y-4">
            <p className="label-mono">Store Details</p>

            <div className="space-y-2">
              <label className="label-mono ml-1">Store Name *</label>
              <Input
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                required
                placeholder="e.g. Tech Bazaar"
                className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="label-mono ml-1">Store URL *</label>
              <div className="flex items-center h-12 rounded-xl border border-(--border-light) bg-white overflow-hidden focus-within:border-(--charcoal) transition-all">
                <span className="px-4 text-xs text-(--charcoal-soft) bg-(--bg-sunken) border-r border-(--border-light) h-full flex items-center whitespace-nowrap font-mono">
                  /store/
                </span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  placeholder="tech-bazaar"
                  className="flex-1 px-3 bg-transparent text-sm outline-none text-(--charcoal) placeholder:text-(--charcoal-mist)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-mono ml-1">Description</label>
              <Input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description about your store..."
                className="h-12 rounded-xl border-(--border-light) bg-white focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-(--charcoal) hover:bg-(--red) text-white rounded-2xl font-bold text-xs uppercase tracking-[1.5px] transition-all group mt-1"
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

        {/* Footer */}
        <div className="mt-7 pt-6 text-center border-t border-(--border-light)">
          <p className="text-sm text-(--charcoal-soft)">
            Want a customer account?{" "}
            <Link
              href="/auth/register"
              className="font-bold text-(--charcoal) hover:text-(--red) transition-colors inline-flex items-center gap-1 group"
            >
              Register here
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
