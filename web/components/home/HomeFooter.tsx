"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Code2, MessageCircle, ExternalLink } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: "Platform",
    links: [
      { label: "Marketplace", href: "/products" },
      { label: "Seller Portal", href: "/merchant" },
      { label: "Courier App", href: "/courier" },
      { label: "Admin Panel", href: "/admin" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Start Selling", href: "/auth/register-merchant" },
      { label: "Pricing Plans", href: "/pricing" },
      { label: "Analytics", href: "/merchant/analytics" },
      { label: "Plugins", href: "/merchant/plugins" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "GDPR", href: "/legal/gdpr" },
    ],
  },
];

const SOCIALS = [
  { icon: Code2,         href: "https://github.com",   label: "GitHub"   },
  { icon: MessageCircle, href: "https://twitter.com",  label: "Twitter"  },
  { icon: ExternalLink,  href: "https://linkedin.com", label: "LinkedIn" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeFooter() {
  return (
    <footer
      style={{
        background: "#07070A",
        borderTop: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* ── Top area ── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-12 sm:pt-20 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">

          {/* Brand + newsletter */}
          <div>
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity duration-200 group-hover:opacity-80"
                style={{ background: "#C8102E" }}
              >
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="font-bold tracking-tight"
                style={{
                  color: "#E8E8EC",
                  letterSpacing: "-0.025em",
                  fontSize: "1.0625rem",
                }}
              >
                Marketplace
              </span>
            </Link>

            <p
              className="text-sm leading-[1.7] mb-8"
              style={{ color: "#3E3E4A", maxWidth: "300px", fontFamily: "var(--font-body)" }}
            >
              A multi-vendor commerce platform that connects merchants, customers,
              and couriers in one seamless experience.
            </p>

            {/* Newsletter */}
            <NewsletterForm />

            {/* Socials */}
            <div className="flex items-center gap-2 mt-8">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <SocialLink key={label} Icon={Icon} href={href} label={label} />
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <p
                  className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase mb-4"
                  style={{ color: "#3A3A44" }}
                >
                  {group.title}
                </p>
                <ul className="space-y-2.5">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <FooterLink href={l.href} label={l.label} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingBlock: "18px",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-xs"
            style={{ color: "#2C2C36" }}
          >
            © {new Date().getFullYear()} Marketplace Inc. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{ color: "#2C2C36" }}
          >
            Built with ♥ for modern commerce
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Newsletter form ───────────────────────────────────────────────────────────

function NewsletterForm() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [hov, setHov]         = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSent(true);
      setEmail("");
    }
  };

  if (sent) {
    return (
      <div
        className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm"
        style={{
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.18)",
          color: "#34D399",
        }}
      >
        <span className="text-base">✓</span>
        You're on the list. Welcome!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2"
      aria-label="Newsletter signup"
    >
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-[#2E2E38]"
        style={{
          background: "#111116",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#C0C0C8",
          fontFamily: "var(--font-body)",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.18)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")
        }
      />
      <button
        type="submit"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250"
        style={{
          background: hov ? "#d91430" : "#C8102E",
          color: "#ffffff",
          boxShadow: hov ? "0 4px 16px rgba(200,16,46,0.3)" : "none",
          transform: hov ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        Subscribe
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </form>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FooterLink({ href, label }: { href: string; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="text-sm transition-colors duration-200"
      style={{ color: hov ? "#7A7A86" : "#36363E", fontFamily: "var(--font-body)" }}
    >
      {label}
    </Link>
  );
}

function SocialLink({
  Icon,
  href,
  label,
}: {
  Icon: React.ElementType;
  href: string;
  label: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
      style={{
        background: hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.035)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
        color: hov ? "#8A8A96" : "#3A3A44",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
    </a>
  );
}
