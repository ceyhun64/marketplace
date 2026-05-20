"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthLayout from "@/components/auth/auth-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PasswordInput from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";

// ── Zod schema ────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    firstName:       z.string().min(1, "First name is required"),
    lastName:        z.string().min(1, "Last name is required"),
    email:           z.string().email("Please enter a valid email address"),
    phone:           z.string().min(1, "Phone number is required"),
    password:        z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

// ── Password strength meter ───────────────────────────────────────────────────

function StrengthMeter({ password }: { password: string }) {
  if (password.length < 4) return null;

  const strong = /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);
  const medium = /[A-Z]/.test(password) && /[0-9]/.test(password);
  const level  = password.length < 8 ? 1 : strong ? 3 : medium ? 2 : 1;
  const label  = level === 3 ? "Strong" : level === 2 ? "Good" : "Weak";
  const color  = level === 3 ? "var(--success)" : level === 2 ? "#f59e0b" : "var(--destructive)";

  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((lvl) => (
          <div
            key={lvl}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: lvl <= level ? color : "var(--border)" }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color }}>
        {label} password
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const form = useForm<RegisterValues>({
    resolver:      zodResolver(registerSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "",
      phone: "", password: "", confirmPassword: "",
    },
  });

  const password        = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const passwordsMatch  = confirmPassword.length > 0 && password === confirmPassword;

  const onSubmit = async (values: RegisterValues) => {
    clearError();
    try {
      await register({
        firstName: values.firstName,
        lastName:  values.lastName,
        email:     values.email,
        phone:     values.phone,
        password:  values.password,
      });
      router.push("/auth/login?registered=1");
    } catch {
      // error is stored in useAuth state; displayed below
    }
  };

  return (
    <AuthLayout variant="register">
      <Card className="shadow-(--shadow-lg)">
        <CardHeader className="[&]:border-b [&]:pb-6">
          <CardTitle className="text-2xl">Create your account.</CardTitle>
          <CardDescription>Free forever. No credit card required.</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-md text-sm font-medium text-destructive bg-destructive/8 border border-destructive/20 animate-in fade-in slide-in-from-top-1"
            >
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                        onChange={(e) => { clearError(); field.onChange(e); }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone — PhoneInput is not compatible with Slot so wired manually */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Phone
                    </FormLabel>
                    <PhoneInput
                      value={field.value}
                      onChange={(val) => field.onChange(val ?? "")}
                      defaultCountry="TR"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Min. 8 characters"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <StrengthMeter password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <PasswordInput
                          placeholder="Repeat password"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          autoComplete="new-password"
                        />
                        {passwordsMatch && (
                          <CheckCircle2
                            className="absolute right-9 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
                            style={{ color: "var(--success)" }}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="default"
                size="xl"
                className="w-full mt-1 group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Create My Account
                    <UserPlus className="group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="[&]:border-t [&]:pt-6 justify-center">
          <p className="text-sm text-muted-foreground">
            Already a member?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
