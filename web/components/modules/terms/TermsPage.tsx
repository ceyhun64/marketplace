"use client";

// components/modules/terms/TermsPage.tsx
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

const LAST_UPDATED = "1 January 2025";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using BAZR Marketplace ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use the Platform. We reserve the right to modify these terms at any time; your continued use of the Platform following any changes constitutes acceptance of those changes.`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: `You must be at least 18 years old to use this Platform. By registering an account, you represent and warrant that you meet this requirement and that all information you provide is accurate, current, and complete. Accounts registered on behalf of a legal entity must be authorised by that entity.`,
  },
  {
    id: "accounts",
    title: "3. Accounts & Security",
    content: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at security@marketplace.example.com if you suspect any unauthorised use of your account. We will not be liable for any loss resulting from unauthorised use of your credentials.`,
  },
  {
    id: "buyers",
    title: "4. Buyer Obligations",
    content: `As a buyer, you agree to: (a) provide accurate shipping and payment information; (b) pay for items you purchase promptly; (c) not engage in fraudulent chargebacks or disputes without legitimate cause; (d) use the Platform's dispute resolution process before contacting your payment provider; (e) treat sellers respectfully in all communications.`,
  },
  {
    id: "sellers",
    title: "5. Seller Obligations",
    content: `Registered merchants agree to: (a) list only products they have the right to sell; (b) accurately describe all products, including any defects or limitations; (c) fulfil orders within stated processing times; (d) comply with all applicable laws, including consumer protection and tax regulations; (e) maintain a return policy at least as generous as ours; (f) not artificially inflate ratings or reviews.`,
  },
  {
    id: "prohibited",
    title: "6. Prohibited Content & Conduct",
    content: `The following are strictly prohibited on the Platform: counterfeit or infringing goods; hazardous, illegal, or regulated items (weapons, controlled substances, etc.); adult content; spam or unsolicited communications; price manipulation or collusion; scraping or automated data collection without written consent; any activity that disrupts or damages Platform infrastructure.`,
  },
  {
    id: "payments",
    title: "7. Payments & Fees",
    content: `All prices are displayed in Turkish Lira (₺) and include applicable VAT unless stated otherwise. Platform commission rates are defined in your merchant agreement and may vary by category and subscription tier. Payouts to merchants are processed weekly, subject to the return window period. We reserve the right to hold funds if fraud or policy violations are suspected.`,
  },
  {
    id: "returns",
    title: "8. Returns & Refunds",
    content: `Our standard return window is 14 days from the date of delivery. Items must be in original, unused condition with all original packaging. Certain categories — including perishables, digital goods, personal hygiene products, and custom-made items — are not eligible for return. Refund timelines and processes are detailed in our Returns & Refunds Policy.`,
  },
  {
    id: "ip",
    title: "9. Intellectual Property",
    content: `All Platform content — including logos, design, software, and documentation — is owned by BAZR and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission. By listing products, sellers grant BAZR a non-exclusive, royalty-free licence to display product images and descriptions for the purpose of operating the Platform.`,
  },
  {
    id: "privacy",
    title: "10. Privacy",
    content: `Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.`,
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    content: `To the maximum extent permitted by law, BAZR shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability to you for any claim shall not exceed the greater of (a) the amount you paid to us in the 12 months preceding the claim, or (b) ₺500. BAZR acts as an intermediary and is not liable for seller conduct, product quality, or delivery delays.`,
  },
  {
    id: "governing",
    title: "12. Governing Law & Disputes",
    content: `These Terms are governed by the laws of the Republic of Turkey. Any disputes arising from these Terms or your use of the Platform shall first be submitted to BAZR's support team for resolution. If unresolved within 30 days, disputes shall be referred to the Istanbul Courts and Enforcement Offices.`,
  },
  {
    id: "termination",
    title: "13. Termination",
    content: `We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we believe violates these Terms or is otherwise harmful to other users, us, or third parties. Upon termination, your right to use the Platform immediately ceases. Provisions that by their nature should survive termination will survive.`,
  },
  {
    id: "contact",
    title: "14. Contact",
    content: `For questions regarding these Terms, please contact our Legal team at legal@marketplace.example.com or write to: BAZR Legal, Levent, Istanbul, Turkey.`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Legal
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Terms of <span className="text-[var(--red)]">Service</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px]">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sticky sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p
                className="font-mono text-[10px] uppercase tracking-[3px] mb-4"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Contents
              </p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all group"
                    style={{ color: "var(--charcoal-soft)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--charcoal)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(51,51,51,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--charcoal-soft)";
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <ChevronRight className="w-3 h-3 opacity-40" />
                    {s.title.replace(/^\d+\.\s/, "")}
                  </a>
                ))}
              </nav>

              {/* Privacy link */}
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid rgba(51,51,51,0.08)" }}
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-[3px] mb-3"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Related
                </p>
                <Link
                  href="/privacy"
                  className="text-[13px] font-semibold flex items-center gap-1.5 hover:underline"
                  style={{ color: "var(--red)" }}
                >
                  Privacy Policy <ChevronRight className="w-3 h-3" />
                </Link>
                <Link
                  href="/returns"
                  className="text-[13px] font-semibold flex items-center gap-1.5 hover:underline mt-2"
                  style={{ color: "var(--red)" }}
                >
                  Returns Policy <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-0">
            {/* Intro */}
            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "rgba(200,16,46,0.04)",
                border: "1px solid rgba(200,16,46,0.12)",
              }}
            >
              <p
                className="text-[0.875rem] leading-relaxed"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Please read these Terms of Service carefully before using BAZR
                Marketplace. These terms constitute a legally binding agreement
                between you and BAZR. By creating an account or making a
                purchase, you agree to be bound by these terms.
              </p>
            </div>

            {/* Sections */}
            <div
              className="bg-white rounded-2xl divide-y overflow-hidden"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
              }}
            >
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="p-8">
                  <h2
                    className="text-[1.125rem] font-bold text-[var(--charcoal)] mb-4"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {section.title}
                  </h2>
                  <p
                    className="text-[0.875rem] leading-relaxed"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    {section.content}
                  </p>
                </section>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p
                className="font-mono text-[11px]"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Effective from {LAST_UPDATED}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "var(--charcoal)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--red)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--charcoal)")
                }
              >
                Contact Legal Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
