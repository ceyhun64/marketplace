"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Printer,
  Cookie,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";

const LAST_UPDATED = "16 May 2026";

const SECTIONS = [
  {
    id: "overview",
    title: "1. Overview",
    content: `This Privacy Policy describes how Marketplace ("we", "us", or "our") collects, uses, and shares information about you when you use our platform — including our public marketplace, independent merchant e-stores, and all related services.\n\nBy using our services you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our services.`,
  },
  {
    id: "data-collected",
    title: "2. Information We Collect",
    items: [
      {
        subtitle: "Account Information",
        text: "When you register, we collect your name, email address, and password (stored as a hashed value — never in plain text). Merchants additionally provide business details and store configuration during the application process.",
      },
      {
        subtitle: "Order & Transaction Data",
        text: "We record orders you place, including product details, shipping address, and payment confirmation references. Payment processing is handled by Stripe — we do not store raw card numbers on our servers.",
      },
      {
        subtitle: "Shipment & Tracking Data",
        text: "We collect the delivery address, shipping carrier information, tracking number, and real-time shipment status events to power our live order-tracking features.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect standard server logs including IP address, browser type, referring URLs, and pages visited. This data is used for security monitoring, analytics, and improving the platform.",
      },
      {
        subtitle: "Cookies & Local Storage",
        text: "We use cookies to maintain your session, remember cart contents, and personalise your experience. You can manage cookie preferences below or in your browser settings.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    items: [
      {
        subtitle: "To provide our services",
        text: "Processing orders, managing your account, and delivering real-time shipment tracking.",
      },
      {
        subtitle: "Communications",
        text: "Sending order confirmations, shipping updates, and support responses. Promotional emails are only sent with your explicit consent and include an unsubscribe link.",
      },
      {
        subtitle: "Security & fraud prevention",
        text: "Monitoring for fraudulent activity, enforcing our Terms of Service, and protecting the safety of our users.",
      },
      {
        subtitle: "Platform improvement",
        text: "Aggregated, anonymised analytics help us understand how the platform is used and prioritise new features.",
      },
      {
        subtitle: "Legal obligations",
        text: "Retaining transaction records as required by applicable tax and accounting law.",
      },
    ],
  },
  {
    id: "sharing",
    title: "4. Sharing Your Information",
    content: `We do not sell your personal data. We share information only in the following circumstances:\n\n— **Merchants**: When you place an order, the merchant receives your name, delivery address, and order details necessary to fulfil the order.\n\n— **Couriers**: Assigned couriers receive your delivery address and contact details to complete the shipment.\n\n— **Service Providers**: We use trusted third-party services (Stripe for payments, cloud hosting providers) who are bound by data processing agreements and may not use your data for their own purposes.\n\n— **Legal Requirements**: We may disclose information if required by law, court order, or to protect the rights, property, or safety of our users and the public.`,
  },
  {
    id: "retention",
    title: "5. Data Retention",
    content: `We retain your account data for as long as your account is active. If you close your account, we anonymise or delete personal data within 90 days, except where we are required to retain records by law (e.g. invoice and accounting data, which is retained for 7 years in many jurisdictions).\n\nOrder history and invoice PDFs may be retained longer for accounting and dispute-resolution purposes.`,
  },
  {
    id: "security",
    title: "6. Security",
    content: `We implement industry-standard security measures including HTTPS/TLS encryption in transit, bcrypt password hashing, JWT-based authentication with short expiry tokens, and regular security reviews.\n\nNo transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. In the event of a data breach that affects your rights or freedoms, we will notify affected users as required by applicable law.`,
  },
  {
    id: "your-rights",
    title: "7. Your Rights (GDPR)",
    items: [
      {
        subtitle: "Access",
        text: "You can request a copy of the personal data we hold about you.",
      },
      {
        subtitle: "Correction",
        text: "You can update your account information at any time from your Profile page.",
      },
      {
        subtitle: "Deletion",
        text: "You can request deletion of your account and personal data, subject to legal retention requirements.",
      },
      {
        subtitle: "Portability",
        text: "You can request your order history and account data in a structured, machine-readable format.",
      },
      {
        subtitle: "Objection / Restriction",
        text: "You may object to certain processing activities or request that we restrict how we process your data.",
      },
      {
        subtitle: "Withdraw Consent",
        text: "Where processing is based on your consent, you may withdraw it at any time without affecting the lawfulness of prior processing.",
      },
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies Policy",
    content: `We use the following types of cookies:\n\n— **Essential cookies**: Required for the platform to function (session management, cart, authentication).\n\n— **Analytics cookies**: Help us understand how the platform is used (page views, feature usage). These are anonymised.\n\n— **Preference cookies**: Remember your settings and personalisation choices.\n\nYou can manage cookie preferences using the controls in the Cookie Settings section below.`,
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    content: `Our services are not directed to children under the age of 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.`,
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and, where appropriate, sending a notification to the email address on your account. The "Last Updated" date at the top of this policy will always reflect the most recent revision.`,
  },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [cookiePrefs, setCookiePrefs] = useState({
    essential: true,
    analytics: true,
    preferences: true,
  });
  const [cookieSaved, setCookieSaved] = useState(false);

  const saveCookiePrefs = () => {
    setCookieSaved(true);
    setTimeout(() => setCookieSaved(false), 3000);
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-main { max-width: 100% !important; padding: 0 !important; }
          nav.sticky { position: static !important; }
          body { font-size: 12pt; }
          h1 { font-size: 24pt; }
          h2 { font-size: 14pt; }
        }
      `}</style>

      <main className="container mx-auto px-4 py-16 max-w-5xl print-main">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
            <ShieldCheck className="w-7 h-7 text-gray-700" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>

          {/* Highlighted last updated */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: "rgba(200,16,46,0.08)",
              border: "1px solid rgba(200,16,46,0.18)",
            }}
          >
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: "var(--red)" }}
            >
              Last Updated
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--red)" }}>
              {LAST_UPDATED}
            </span>
          </div>

          <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            We respect your privacy. This policy explains what data we collect,
            why we collect it, and how we keep it safe.
          </p>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="no-print mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sticky TOC sidebar */}
          <aside className="no-print hidden lg:block">
            <nav className="sticky top-24">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Contents
              </p>
              <ol className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setActiveSection(s.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all group"
                      style={{
                        background:
                          activeSection === s.id
                            ? "rgba(200,16,46,0.07)"
                            : "transparent",
                        color:
                          activeSection === s.id
                            ? "var(--red)"
                            : "var(--charcoal-soft)",
                        fontWeight: activeSection === s.id ? 600 : 400,
                      }}
                    >
                      <ChevronRight
                        className="w-3 h-3 flex-shrink-0 transition-transform"
                        style={{
                          color:
                            activeSection === s.id
                              ? "var(--red)"
                              : "transparent",
                          transform:
                            activeSection === s.id ? "scale(1)" : "scale(0.8)",
                        }}
                      />
                      <span className="truncate">
                        {s.title.replace(/^\d+\.\s/, "")}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Related
                </p>
                <Link
                  href="/terms"
                  className="flex items-center gap-1 text-[13px] font-semibold hover:underline"
                  style={{ color: "var(--red)" }}
                >
                  Terms of Service <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <div>
            {/* Mobile TOC */}
            <nav className="no-print lg:hidden rounded-2xl border border-border bg-muted/30 p-5 mb-8">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Contents
              </p>
              <ol className="space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections */}
            <div className="space-y-12">
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border flex items-center gap-2">
                    {section.title}
                  </h2>

                  {section.content && (
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content.split("\n").map((line, i) => {
                        if (line.startsWith("—")) {
                          const parts = line.replace("— ", "").split("**: ");
                          if (parts.length === 2) {
                            return (
                              <p
                                key={i}
                                className="mb-2 pl-4 border-l-2 border-border"
                              >
                                <strong className="text-foreground">
                                  {parts[0].replace("**", "")}
                                </strong>
                                : {parts[1]}
                              </p>
                            );
                          }
                        }
                        return line ? (
                          <p key={i} className="mb-3">
                            {line}
                          </p>
                        ) : null;
                      })}
                    </div>
                  )}

                  {section.items && (
                    <div className="space-y-4">
                      {section.items.map((item) => (
                        <div
                          key={item.subtitle}
                          className="rounded-xl border border-border bg-card p-4"
                        >
                          <p className="font-semibold text-sm mb-1">
                            {item.subtitle}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* GDPR Rights exercise buttons */}
                  {section.id === "your-rights" && (
                    <div
                      className="no-print mt-6 p-5 rounded-xl"
                      style={{
                        background: "rgba(200,16,46,0.04)",
                        border: "1px solid rgba(200,16,46,0.12)",
                      }}
                    >
                      <p className="text-sm font-bold text-[var(--charcoal)] mb-3">
                        Exercise Your Rights
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            label: "Request My Data",
                            href: "/contact?subject=data-access",
                          },
                          {
                            label: "Delete My Account",
                            href: "/contact?subject=data-deletion",
                          },
                          {
                            label: "Export My Data",
                            href: "/contact?subject=data-portability",
                          },
                          {
                            label: "Unsubscribe Emails",
                            href: "/contact?subject=unsubscribe",
                          },
                        ].map((action) => (
                          <Link
                            key={action.label}
                            href={action.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                            style={{
                              border: "1px solid rgba(200,16,46,0.25)",
                              color: "var(--red)",
                              background: "white",
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {action.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}

              {/* Cookie controls */}
              <section id="cookie-settings">
                <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border flex items-center gap-2">
                  <Cookie className="w-4 h-4" style={{ color: "var(--red)" }} />
                  Cookie Settings
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      key: "essential" as const,
                      label: "Essential Cookies",
                      desc: "Required for the platform to function — login, cart, authentication.",
                      locked: true,
                    },
                    {
                      key: "analytics" as const,
                      label: "Analytics Cookies",
                      desc: "Help us understand how you use the platform (anonymised). You can opt out.",
                      locked: false,
                    },
                    {
                      key: "preferences" as const,
                      label: "Preference Cookies",
                      desc: "Remember your settings and personalisation choices.",
                      locked: false,
                    },
                  ].map((cookie) => (
                    <div
                      key={cookie.key}
                      className="flex items-start justify-between p-4 rounded-xl border border-border bg-card gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          {cookie.label}
                          {cookie.locked && (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(200,16,46,0.08)",
                                color: "var(--red)",
                              }}
                            >
                              Always On
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cookie.desc}
                        </p>
                      </div>
                      <button
                        disabled={cookie.locked}
                        onClick={() =>
                          setCookiePrefs((p) => ({
                            ...p,
                            [cookie.key]: !p[cookie.key],
                          }))
                        }
                        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60"
                        style={{
                          background: cookiePrefs[cookie.key]
                            ? "var(--red)"
                            : "#d1d5db",
                        }}
                        role="switch"
                        aria-checked={cookiePrefs[cookie.key]}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                          style={{
                            transform: cookiePrefs[cookie.key]
                              ? "translateX(20px)"
                              : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={saveCookiePrefs}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "var(--charcoal)" }}
                  >
                    Save Preferences
                  </button>
                  {cookieSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Preferences saved
                    </span>
                  )}
                </div>
              </section>
            </div>

            {/* Contact */}
            <div className="mt-14 rounded-2xl bg-gray-900 text-white p-7">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-lg">
                  Questions about this policy?
                </h3>
              </div>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                If you have questions about how we handle your data, would like
                to exercise your data rights, or need to report a privacy
                concern, please get in touch.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
