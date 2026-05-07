"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Search, MessageSquare } from "lucide-react";

const FAQ_CATEGORIES = [
  {
    key: "orders",
    label: "Orders & Shipping",
    questions: [
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you'll receive a tracking number via email. You can also track your shipment in real time from the Orders section in your account, or visit our Track page and enter your tracking number.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3–5 business days. Express delivery is available at checkout and arrives within 1–2 business days. Estimated delivery dates are shown at checkout based on your location.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Orders can be cancelled within 1 hour of placement if they haven't been picked up by the courier. After that, you'll need to wait for delivery and then request a return. Visit the Orders page to manage your orders.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently we ship within Turkey only. International shipping is on our roadmap — sign up for our newsletter to be notified when it becomes available.",
      },
    ],
  },
  {
    key: "returns",
    label: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "You can return most items within 14 days of delivery for a full refund, provided they are in their original condition and packaging. Some product categories (such as personal care, digital goods, and custom items) are excluded from returns.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to Orders in your account, select the order, and click 'Request Return'. You'll receive a prepaid return label by email within 24 hours. Drop the package off at any approved courier point.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 3 business days of us receiving the returned item. The funds will appear in your original payment method within 5–10 business days depending on your bank.",
      },
    ],
  },
  {
    key: "payments",
    label: "Payments & Security",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as bank transfers. All transactions are secured with 256-bit SSL encryption.",
      },
      {
        q: "Is it safe to save my card details?",
        a: "Yes. We never store raw card data on our servers. Card details are tokenised and stored securely by our certified payment processor. Your data is protected to PCI-DSS Level 1 standards.",
      },
      {
        q: "Why was my payment declined?",
        a: "Payments can be declined for a number of reasons: incorrect card details, insufficient funds, or a block from your bank. Try a different card or contact your bank. If the issue persists, reach out to our support team.",
      },
    ],
  },
  {
    key: "account",
    label: "Account & Profile",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Sign Up' in the top-right corner, enter your name, email, and a password. You'll receive a verification email — click the link to activate your account and start shopping.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a link to reset your password. The link expires after 24 hours.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion from the Profile Settings page. Note that this action is permanent and will remove all your order history, saved addresses, and wishlist items.",
      },
    ],
  },
  {
    key: "sellers",
    label: "Selling on Marketplace",
    questions: [
      {
        q: "How do I become a seller?",
        a: "Apply via the 'Become a Seller' page. Fill in your business details, agree to our seller terms, and our team will review your application within 1–2 business days. Once approved, you can start listing products immediately.",
      },
      {
        q: "What commission does Marketplace charge?",
        a: "Commission rates depend on your subscription plan and product category. The full fee schedule is available in your merchant dashboard under Billing. There are no listing fees — you only pay when you sell.",
      },
      {
        q: "When do I receive my payouts?",
        a: "Payouts are processed every Monday for sales completed the previous week (after the return window closes). Funds are transferred directly to your registered bank account.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b last:border-0 transition-all"
      style={{ borderColor: "rgba(51,51,51,0.08)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span
          className="font-bold text-[var(--charcoal)] text-[0.9375rem] leading-snug"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {q}
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
          className="pb-5 text-[0.875rem] leading-relaxed"
          style={{
            color: "var(--charcoal-soft)",
            fontFamily: "var(--font-body)",
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("orders");

  const filtered = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (item) =>
        search === "" ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.questions.length > 0);

  const displayCategories = search
    ? filtered
    : FAQ_CATEGORIES.filter((c) => c.key === activeCategory);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Help Center
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently Asked{" "}
            <span className="text-[var(--red)]">Questions</span>
          </h1>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--charcoal-soft)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full h-12 pl-11 pr-4 rounded-xl outline-none text-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontFamily: "var(--font-body)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sidebar */}
          {!search && (
            <div className="space-y-1 lg:sticky lg:top-24 self-start">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background:
                      activeCategory === cat.key
                        ? "var(--charcoal)"
                        : "transparent",
                    color:
                      activeCategory === cat.key
                        ? "#fff"
                        : "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-8">
            {displayCategories.length === 0 && (
              <div className="text-center py-16">
                <HelpCircle
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: "rgba(51,51,51,0.15)" }}
                />
                <p className="text-[var(--charcoal-soft)]">
                  No results for "{search}"
                </p>
              </div>
            )}

            {displayCategories.map((cat) => (
              <div key={cat.key}>
                {search && (
                  <h2
                    className="font-bold text-[var(--charcoal)] mb-4"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {cat.label}
                  </h2>
                )}
                <div
                  className="bg-white rounded-2xl px-6"
                  style={{
                    border: "1px solid rgba(51,51,51,0.08)",
                    boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                  }}
                >
                  {cat.questions.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}

            {/* Still need help? */}
            <div
              className="flex flex-col sm:flex-row items-center gap-6 p-7 rounded-2xl"
              style={{ background: "var(--charcoal)" }}
            >
              <div className="flex-1">
                <h3
                  className="text-white font-bold mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Still need help?
                </h3>
                <p className="text-[var(--charcoal-soft)] text-sm">
                  Our support team is available Mon–Fri, 09:00–18:00.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all"
                style={{ background: "var(--red)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "#a00d24")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--red)")
                }
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
