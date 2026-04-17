"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      // Middleware zaten yönlendiriyor ama fallback olarak:
      const { user } = useAuth.getState();
      if (!user) return;
      const roleRoutes: Record<string, string> = {
        Admin: "/admin",
        Merchant: "/merchant",
        Courier: "/courier",
        Customer: "/",
      };
      router.push(roleRoutes[user.role] ?? "/");
    } catch {
      // error state useAuth içinde set edildi
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-lg font-bold text-gray-900 tracking-tight"
          >
            Marketplace
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">
            Giriş Yap
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hesabın yok mu?{" "}
            <Link
              href="/auth/register"
              className="text-gray-900 font-medium underline underline-offset-2"
            >
              Kayıt ol
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ornek@mail.com"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Şifre
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Şifremi unuttum
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
