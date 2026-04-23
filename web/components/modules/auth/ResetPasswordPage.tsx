"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => {
      const res = await api.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Şifre sıfırlama başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.",
      );
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-bold text-gray-900">Geçersiz Bağlantı</h1>
          <p className="text-sm text-gray-500">
            Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
          </p>
          <Link href="/auth/forgot-password">
            <Button className="w-full">Yeni Bağlantı Talep Et</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Şifre Güncellendi!
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Şifreniz başarıyla güncellendi. Giriş sayfasına
              yönlendiriliyorsunuz...
            </p>
          </div>
          <Link href="/auth/login">
            <Button className="w-full">Hemen Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6)
      return { level: "weak", label: "Zayıf", color: "bg-red-400" };
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))
      return { level: "medium", label: "Orta", color: "bg-yellow-400" };
    return { level: "strong", label: "Güçlü", color: "bg-green-500" };
  };

  const strength = passwordStrength(form.password);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link
          href="/auth/login"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Giriş sayfasına dön
        </Link>

        <div className="mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Yeni Şifre Belirle
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Güvenli bir şifre seçin. En az 8 karakter olmalıdır.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.password !== form.confirm) {
              toast.error("Şifreler eşleşmiyor");
              return;
            }
            if (form.password.length < 6) {
              toast.error("Şifre en az 6 karakter olmalıdır");
              return;
            }
            mutation.mutate({ token, newPassword: form.password });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">Yeni Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="En az 8 karakter"
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Strength indicator */}
            {strength && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {["weak", "medium", "strong"].map((level, i) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        (strength.level === "weak" && i === 0) ||
                        (strength.level === "medium" && i <= 1) ||
                        strength.level === "strong"
                          ? strength.color
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{strength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Şifre Tekrar</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirm: e.target.value }))
              }
              placeholder="Şifreyi tekrar girin"
              required
              className={`h-11 ${
                form.confirm && form.password !== form.confirm
                  ? "border-red-300 focus-visible:ring-red-300"
                  : ""
              }`}
            />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={
              mutation.isPending ||
              !form.password ||
              !form.confirm ||
              form.password !== form.confirm
            }
          >
            {mutation.isPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Yükleniyor...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
