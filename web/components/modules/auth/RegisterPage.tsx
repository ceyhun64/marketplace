"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [validationError, setValidationError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      setValidationError(
        "Password must be at least 8 characters for your security.",
      );
      return;
    }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setValidationError(
        "Password must contain at least one uppercase letter and one number.",
      );
      return;
    }
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      router.push("/auth/login?registered=1");
    } catch {
      // Error is managed via store
    }
  };

  const displayError = validationError || error;

  return (
   
      <div className="min-h-screen  flex items-center justify-center p-6 py-12">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#C84B2F]/5 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-[#1A4A6B]/5 blur-[100px]" />
        </div>

        <div className="w-full max-w-[550px] relative">
          {/* Register Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-serif font-bold text-black mb-3">
                Create New Account
              </h1>
              <p className="text-[#7A7060] text-sm">
                Enter your details to join the premium shopping experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {displayError && (
                <div className="px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in fade-in slide-in-from-top-1">
                  {displayError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                    First Name
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
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                    Last Name
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
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                  Email
                </Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="example@mail.com"
                  className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                  Phone
                </Label>
                <Input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000"
                  className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                    Password
                  </Label>
                  <Input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                    Confirm
                  </Label>
                  <Input
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-black hover:bg-[#C84B2F] text-white rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all group mt-4 shadow-lg shadow-black/5"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Create My Account
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-black/[0.03] text-center">
              <p className="text-sm text-[#7A7060]">
                Already a member?{" "}
                <Link
                  href="/auth/login"
                  className="text-black font-bold hover:text-[#C84B2F] transition-colors inline-flex items-center gap-1 group"
                >
                  Sign in
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-[#7A7060] font-mono uppercase tracking-[3px] opacity-50">
            Your personal data is protected with 256-bit encryption
          </p>
        </div>
      </div>
   
  );
}
