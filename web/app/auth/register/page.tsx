"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, UserPlus, ShieldCheck } from "lucide-react";

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
      setValidationError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (form.password.length < 8) {
      setValidationError("Güvenliğiniz için şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setValidationError(
        "Şifre en az bir büyük harf ve bir rakam içermelidir.",
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
      // Hata store üzerinden yönetiliyor
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center p-6 py-12">
      {/* Arka Plan Dekorasyonu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#C84B2F]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-[#1A4A6B]/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-[550px] relative">
        {/* Brand Header */}
     

        {/* Register Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-black/[0.03] rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-serif font-bold text-black mb-3">
              Yeni Hesap Oluştur
            </h1>
            <p className="text-[#7A7060] text-sm">
              Premium alışveriş deneyimine katılmak için bilgilerinizi girin.
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
                  Ad
                </Label>
                <Input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Ahmet"
                  className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                  Soyad
                </Label>
                <Input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Yılmaz"
                  className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                E-Posta
              </Label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="ornek@mail.com"
                className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                Telefon
              </Label>
              <Input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="05XX XXX XX XX"
                className="h-12 rounded-xl border-black/[0.05] bg-white/50 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-[2px] text-[#7A7060] ml-1">
                  Şifre
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
                  Tekrar
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
                  Hesabımı Oluştur
                  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/[0.03] text-center">
            <p className="text-sm text-[#7A7060]">
              Zaten üye misiniz?{" "}
              <Link
                href="/auth/login"
                className="text-black font-bold hover:text-[#C84B2F] transition-colors inline-flex items-center gap-1 group"
              >
                Giriş yapın
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[#7A7060] font-mono uppercase tracking-[3px] opacity-50">
          Kişisel verileriniz 256-bit şifreleme ile korunmaktadır
        </p>
      </div>
    </div>
  );
}
