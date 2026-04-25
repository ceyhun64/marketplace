"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post("/api/auth/forgot-password", { email });
      return res.data;
    },
    onSuccess: () => {
      setSent(true);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "İstek gönderilemedi");
    },
  });

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              E-posta Gönderildi
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              <strong>{email}</strong> adresine şifre sıfırlama bağlantısı
              gönderdik. Gelen kutunuzu kontrol edin.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Farklı e-posta dene
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş sayfasına dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
   
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Back */}
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Giriş sayfasına dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Şifremi Unuttum
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              mutation.mutate(email);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                autoComplete="email"
                autoFocus
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={mutation.isPending || !email}
            >
              {mutation.isPending
                ? "Gönderiliyor..."
                : "Sıfırlama Bağlantısı Gönder"}
            </Button>
          </form>
        </div>
      </div>
   
  );
}
