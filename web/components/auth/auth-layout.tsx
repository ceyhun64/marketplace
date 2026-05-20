import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  variant: "login" | "register";
}

export default function AuthLayout({ children, variant }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="shrink-0 w-full max-w-lg mx-auto px-6 pt-8 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" style={{ textDecoration: "none" }}>
          <div
            className="w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{
              background:   "var(--primary)",
              borderRadius: "var(--radius-md)",
              boxShadow:    "0 2px 8px rgba(200,16,46,0.25)",
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-lg font-medium tracking-tight text-foreground leading-none">
            BAZR
          </span>
        </Link>

        {variant === "login" ? (
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Register
            </Link>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        )}
      </header>

      {/* Centred form area */}
      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 pb-8 text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
          256-bit SSL · GDPR compliant · No spam, ever
        </p>
      </footer>
    </div>
  );
}
