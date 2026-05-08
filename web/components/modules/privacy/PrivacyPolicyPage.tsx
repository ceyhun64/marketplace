import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";

const LAST_UPDATED = "May 2026";

const SECTIONS = [
  {
    id: "overview",
    title: "1. Overview",
    content: `This Privacy Policy describes how Marketplace ("we", "us", or "our") collects, uses, and shares information about you when you use our platform — including our public marketplace, independent merchant e-stores, and all related services.

By using our services you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our services.`,
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
        text: "We use cookies to maintain your session, remember cart contents, and personalise your experience. You can disable cookies in your browser settings, though some features may not function correctly.",
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
    content: `We do not sell your personal data. We share information only in the following circumstances:

— **Merchants**: When you place an order, the merchant receives your name, delivery address, and order details necessary to fulfil the order.

— **Couriers**: Assigned couriers receive your delivery address and contact details to complete the shipment.

— **Service Providers**: We use trusted third-party services (Stripe for payments, cloud hosting providers) who are bound by data processing agreements and may not use your data for their own purposes.

— **Legal Requirements**: We may disclose information if required by law, court order, or to protect the rights, property, or safety of our users and the public.`,
  },
  {
    id: "retention",
    title: "5. Data Retention",
    content: `We retain your account data for as long as your account is active. If you close your account, we anonymise or delete personal data within 90 days, except where we are required to retain records by law (e.g. invoice and accounting data, which is retained for 7 years in many jurisdictions).

Order history and invoice PDFs may be retained longer for accounting and dispute-resolution purposes.`,
  },
  {
    id: "security",
    title: "6. Security",
    content: `We implement industry-standard security measures including HTTPS/TLS encryption in transit, bcrypt password hashing, JWT-based authentication with short expiry tokens, and regular security reviews. 

No transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. In the event of a data breach that affects your rights or freedoms, we will notify affected users as required by applicable law.`,
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
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
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies Policy",
    content: `We use the following types of cookies:

— **Essential cookies**: Required for the platform to function (session management, cart, authentication).

— **Analytics cookies**: Help us understand how the platform is used (page views, feature usage). These are anonymised.

— **Preference cookies**: Remember your settings and personalisation choices.

You can manage cookie preferences through your browser settings. Note that disabling essential cookies will prevent you from logging in or completing purchases.`,
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
  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
          <ShieldCheck className="w-7 h-7 text-gray-700" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: <strong>{LAST_UPDATED}</strong>
        </p>
        <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed mt-4">
          We respect your privacy. This policy explains what data we collect,
          why we collect it, and how we keep it safe.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="rounded-2xl border border-border bg-muted/30 p-5 mb-12">
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
            <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border">
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
          </section>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-14 rounded-2xl bg-gray-900 text-white p-7">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-lg">Questions about this policy?</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5 leading-relaxed">
          If you have questions about how we handle your data, would like to
          exercise your data rights, or need to report a privacy concern, please
          get in touch.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </main>
  );
}
