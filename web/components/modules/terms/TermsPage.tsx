"use client";

import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";

const LAST_UPDATED = "1 May 2026";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using Marketplace ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.

These Terms apply to all visitors, users, merchants, and others who access or use the Platform. By creating an account or completing a transaction, you confirm that you are at least 18 years of age (or the age of legal majority in your jurisdiction) and have the legal capacity to enter into binding agreements.`,
  },
  {
    id: "accounts",
    title: "2. Accounts & Registration",
    content: `To access certain features of the Platform, you must register for an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and promptly update your account information
• Keep your password confidential and not share access with third parties
• Accept responsibility for all activities that occur under your account
• Notify us immediately of any unauthorised use of your account

We reserve the right to suspend or terminate accounts that violate these Terms, contain false information, or are inactive for extended periods.`,
  },
  {
    id: "buying",
    title: "3. Buying on the Platform",
    content: `When you place an order through the Platform, you are entering into a contract with the individual merchant, not with Marketplace. Marketplace acts as an intermediary facilitating the transaction.

Order acceptance occurs when the merchant confirms your order. Until that point, orders may be cancelled by either party. Payment is processed at checkout and held in escrow until order fulfilment is confirmed.

Buyers are responsible for providing accurate delivery information. Marketplace is not liable for failed deliveries resulting from incorrect addresses.`,
  },
  {
    id: "selling",
    title: "4. Selling on the Platform",
    content: `Merchants must be approved before listing products. By selling on the Platform, you agree to:

• List only products you are legally permitted to sell
• Provide accurate product descriptions, images, and stock levels
• Fulfil orders within the stated processing times
• Respond to customer enquiries within 48 hours
• Honour your stated return and refund policies
• Comply with all applicable consumer protection laws

Marketplace charges a commission on each sale as specified in your subscription agreement. Commission rates are subject to change with 30 days' notice.`,
  },
  {
    id: "prohibited",
    title: "5. Prohibited Content & Conduct",
    content: `The following are strictly prohibited on the Platform:

• Counterfeit, replica, or unauthorised goods
• Hazardous, illegal, or regulated items without proper authorisation
• Adult content, weapons, or controlled substances
• Misleading product descriptions or fraudulent listings
• Harassment, abuse, or threatening behaviour toward other users
• Manipulation of reviews, ratings, or search rankings
• Scraping, data mining, or automated access without permission
• Any activity that disrupts or interferes with the Platform

Violations may result in immediate account suspension, removal of listings, and where appropriate, referral to law enforcement.`,
  },
  {
    id: "payments",
    title: "6. Payments & Fees",
    content: `All prices on the Platform are displayed in Turkish Lira (TRY) unless stated otherwise. Marketplace uses secure third-party payment processors and does not store raw card data.

Merchant payouts are processed weekly (every Monday) for completed orders from the previous week, after the applicable return window has closed. Payouts are subject to any outstanding fees or chargebacks.

Buyers may be eligible for refunds in accordance with our Returns Policy. Chargebacks initiated outside of our dispute resolution process may result in account restrictions.`,
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: `All content on the Platform — including logos, design, software, and text — is owned by or licensed to Marketplace and protected by applicable intellectual property laws.

By uploading content (product images, descriptions, store branding), you grant Marketplace a non-exclusive, worldwide, royalty-free licence to display and use that content for the operation and promotion of the Platform.

You represent that you own or have the right to use any content you upload, and that it does not infringe any third-party rights.`,
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by law, Marketplace shall not be liable for:

• Indirect, incidental, special, or consequential damages
• Loss of profits, revenue, data, or business opportunities
• Damages resulting from the conduct of third-party merchants
• Service interruptions, errors, or security breaches beyond our reasonable control

Our total liability to you for any claim arising from your use of the Platform shall not exceed the amount you paid to Marketplace in the three months preceding the claim.

Nothing in these Terms limits liability for death, personal injury, fraud, or any other matter that cannot be excluded by law.`,
  },
  {
    id: "dispute",
    title: "9. Dispute Resolution",
    content: `If a dispute arises between a buyer and merchant, we encourage both parties to resolve it directly. If this fails, you may raise a formal dispute through the Platform's dispute resolution centre, available in your account settings.

Marketplace will review disputes and may mediate, but is not obligated to resolve disputes between buyers and merchants. Marketplace's decision in mediation is advisory only.

These Terms are governed by the laws of the Republic of Turkey. Any legal proceedings shall be conducted in the courts of Istanbul.`,
  },
  {
    id: "changes",
    title: "10. Changes to These Terms",
    content: `Marketplace reserves the right to modify these Terms at any time. Material changes will be communicated via email to registered users and displayed prominently on the Platform at least 14 days before taking effect.

Your continued use of the Platform after the effective date of revised Terms constitutes your acceptance. If you do not agree to the revised Terms, you must stop using the Platform and may close your account.`,
  },
];

function Section({
  section,
  defaultOpen,
}: {
  section: (typeof SECTIONS)[0];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(51,51,51,0.08)",
        background: "white",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span
          className="font-bold text-[0.9375rem]"
          style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
        >
          {section.title}
        </span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{
            color: "var(--charcoal-soft)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div
          className="px-6 pb-6 text-sm leading-relaxed whitespace-pre-line"
          style={{
            color: "var(--charcoal-soft)",
            fontFamily: "var(--font-body)",
            borderTop: "1px solid rgba(51,51,51,0.06)",
            paddingTop: "1.25rem",
          }}
        >
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Legal
            </span>
          </div>
          <h1
            className="text-[36px] lg:text-[52px] text-white leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Terms of <span style={{ color: "var(--red)" }}>Service</span>
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
          >
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-12 space-y-4">
        {/* Intro box */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{
            background: "rgba(200,16,46,0.04)",
            border: "1px solid rgba(200,16,46,0.12)",
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
          >
            Please read these Terms of Service carefully before using the
            Marketplace platform. These Terms constitute a legally binding
            agreement between you and Marketplace. If you have any questions,
            please{" "}
            <a
              href="/contact"
              style={{ color: "var(--red)" }}
              className="underline"
            >
              contact us
            </a>
            .
          </p>
        </div>

        {SECTIONS.map((section, i) => (
          <Section key={section.id} section={section} defaultOpen={i === 0} />
        ))}

        <div
          className="text-center py-8 text-sm"
          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
        >
          Questions about these terms?{" "}
          <a
            href="/contact"
            style={{ color: "var(--red)" }}
            className="underline"
          >
            Contact our legal team
          </a>
        </div>
      </div>
    </main>
  );
}
