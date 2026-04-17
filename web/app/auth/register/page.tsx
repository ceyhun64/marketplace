"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

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
      setValidationError("Şifreler eşleşmiyor");
      return;
    }
    if (form.password.length < 8) {
      setValidationError("Şifre en az 8 karakter olmalı");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setValidationError("Şifre en az bir büyük harf içermeli");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setValidationError("Şifre en az bir rakam içermeli");
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
      // error store'da
    }
  };

  const displayError = validationError || error;

  const fields: {
    label: string;
    name: keyof typeof form;
    type: string;
    placeholder: string;
  }[] = [
    { label: "Ad", name: "firstName", type: "text", placeholder: "Ahmet" },
    { label: "Soyad", name: "lastName", type: "text", placeholder: "Yılmaz" },
    {
      label: "E-posta",
      name: "email",
      type: "email",
      placeholder: "ornek@mail.com",
    },
    {
      label: "Telefon",
      name: "phone",
      type: "tel",
      placeholder: "05XX XXX XX XX",
    },
    {
      label: "Şifre",
      name: "password",
      type: "password",
      placeholder: "••••••••",
    },
    {
      label: "Şifre Tekrar",
      name: "confirm",
      type: "password",
      placeholder: "••••••••",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h1>
          <p className="text-sm text-gray-500 mt-1">
            Alışverişe başlamak için kaydolun
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                required
                type={type}
                name={name}
                placeholder={placeholder}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          ))}

          {displayError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-400">
          Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.
        </p>

        <div className="mt-4 text-sm text-center">
          <span className="text-gray-500">Zaten hesabınız var mı? </span>
          <Link
            href="/auth/login"
            className="text-gray-900 font-medium hover:underline"
          >
            Giriş yapın →
          </Link>
        </div> 
      </div>
    </div>
  );
}
