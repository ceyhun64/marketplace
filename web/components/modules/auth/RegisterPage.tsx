"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import PhoneInput from "@/components/ui/phone-input";
import PasswordInput from "@/components/ui/password-input";
import AuthSplitLayout from "./AuthSplitLayout";

// ── Password strength helper ──────────────────────────────────────────────────

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length < 4)  return { level: 0, label: "",        color: ""                  };
  if (pw.length < 8)  return { level: 1, label: "Weak",    color: "var(--red)"        };
  const strong = /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw);
  if (strong)         return { level: 3, label: "Strong",  color: "var(--success)"    };
  const medium = /[A-Z]/.test(pw) && /[0-9]/.test(pw);
  if (medium)         return { level: 2, label: "Good",    color: "var(--warning)"    };
                      return { level: 1, label: "Weak",    color: "var(--red)"        };
}

// ── Form component ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "",
  });
  const [validationError, setValidationError] = useState("");
  const strength = passwordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearError();
    setValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm)        { setValidationError("Passwords do not match."); return; }
    if (form.password.length < 8)              { setValidationError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setValidationError("Password needs an uppercase letter and a number."); return;
    }
    try {
      await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, password: form.password,
      });
      router.push("/auth/login?registered=1");
    } catch {}
  };

  const displayError = validationError || error;
  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm;

  return (
    <AuthSplitLayout variant="register">
      <div className="w-full">
        {/* Heading */}
        <div className="mb-8">
          <h1
            className="font-heading leading-tight mb-2 text-(--charcoal)"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 400, letterSpacing: "-0.025em" }}
          >
            Create your account.
          </h1>
          <p className="text-[0.9375rem] text-(--charcoal-soft)">
            Free forever. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {displayError && (
            <div className="px-4 py-3.5 rounded-2xl text-[13px] font-medium animate-in fade-in slide-in-from-top-1 bg-(--danger-bg) border border-(--danger-border) text-(--danger)">
              {displayError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label-mono">First Name</label>
              <Input
                name="firstName" value={form.firstName} onChange={handleChange}
                required placeholder="John"
                className="h-11 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="label-mono">Last Name</label>
              <Input
                name="lastName" value={form.lastName} onChange={handleChange}
                required placeholder="Smith"
                className="h-11 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="label-mono">Email</label>
            <Input
              name="email" type="email" value={form.email} onChange={handleChange}
              required placeholder="you@example.com"
              className="h-11 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="label-mono">Phone</label>
            <PhoneInput
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v ?? "" }))}
              defaultCountry="TR"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="label-mono">Password</label>
            <PasswordInput
              name="password" value={form.password} onChange={handleChange}
              required placeholder="Min. 8 characters"
              className="h-11 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
            />
            {/* Strength meter */}
            {form.password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: lvl <= strength.level ? strength.color : "var(--border-mid)" }}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                    {strength.label} password
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label className="label-mono">Confirm Password</label>
            <div className="relative">
              <PasswordInput
                name="confirm" value={form.confirm} onChange={handleChange}
                required placeholder="Repeat password"
                className="h-11 rounded-xl bg-white border-(--border-light) focus:border-(--charcoal) focus:ring-0 transition-all"
              />
              {passwordsMatch && (
                <CheckCircle2
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-(--success)"
                />
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-[1.5px] transition-all group mt-1 bg-(--charcoal) hover:bg-(--red) text-white"
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

        {/* Footer */}
        <div className="mt-7 pt-6 text-center border-t border-(--border-light)">
          <p className="text-sm text-(--charcoal-soft)">
            Already a member?{" "}
            <Link href="/auth/login"
              className="font-bold text-(--charcoal) hover:text-(--red) transition-colors inline-flex items-center gap-1 group">
              Sign in
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
