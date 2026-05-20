"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
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

// ── Zod schema ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// ── Form (needs Suspense boundary for useSearchParams) ────────────────────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();

  const form = useForm<LoginValues>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    clearError();
    try {
      await login(values.email, values.password);
      const { user } = useAuth.getState();
      if (!user) return;
      const redirect = searchParams.get("redirect");
      if (redirect && user.role === "Customer") { router.push(redirect); return; }
      const destinations: Record<string, string> = {
        Admin: "/admin", Merchant: "/merchant", Courier: "/courier", Customer: "/",
      };
      router.push(destinations[user.role] ?? "/");
    } catch {
      // error is stored in useAuth state; displayed below
    }
  };

  return (
    <Card className="shadow-(--shadow-lg)">
      <CardHeader className="[&]:border-b [&]:pb-6">
        <CardTitle className="text-2xl">Welcome back.</CardTitle>
        <CardDescription>Sign in to your BAZR account.</CardDescription>
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
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Email Address
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Password
                    </FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      tabIndex={-1}
                      className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      value={field.value}
                      onChange={(e) => { clearError(); field.onChange(e); }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="default"
              size="xl"
              className="w-full mt-2 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2.5 [&]:border-t [&]:pt-6">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
          >
            Create one free
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          Want to sell?{" "}
          <Link
            href="/auth/apply-merchant"
            className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
          >
            Become a Merchant
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6 space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-md bg-muted animate-pulse"
                />
              ))}
            </CardContent>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
