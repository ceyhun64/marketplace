"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Truck,
  RefreshCw,
  CreditCard,
  Store,
  Shield,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  {
    key: "orders",
    icon: ShoppingCart,
    label: "Orders & Checkout",
    color: "var(--red)",
    articles: [
      { q: "How do I place an order?", a: "Browse products, add to cart, proceed to checkout, enter shipping address and payment info, then confirm." },
      { q: "Can I modify or cancel my order?", a: "You can cancel within 30 minutes of placing if it hasn't been processed. Go to Orders → select order → Cancel." },
      { q: "How do I track my order?", a: "Visit /track and enter your tracking number, or go to My Orders and click the order to see real-time status." },
      { q: "What if I receive the wrong item?", a: "Contact us within 48 hours via the Orders page. We'll arrange a return and resend the correct item at no cost." },
    ],
  },
  {
    key: "shipping",
    icon: Truck,
    label: "Shipping & Delivery",
    color: "#2563eb",
    articles: [
      { q: "How long does delivery take?", a: "Standard shipping is 2–5 business days. Express shipping is 1–2 business days. Delivery times vary by seller location." },
      { q: "Do you offer free shipping?", a: "Orders over ₺500 qualify for free standard shipping. Promotional free shipping events are announced on our Deals page." },
      { q: "Can I ship to multiple addresses?", a: "Currently each order ships to a single address. Place separate orders for different addresses." },
      { q: "What are the shipping carriers?", a: "We work with Yurtiçi Kargo, Aras Kargo, and MNG Kargo. Your tracking number will indicate the carrier." },
    ],
  },
  {
    key: "returns",
    icon: RefreshCw,
    label: "Returns & Refunds",
    color: "#059669",
    articles: [
      { q: "What is the return policy?", a: "Most items can be returned within 14 days of delivery, unused and in original packaging. Visit our Returns page for details." },
      { q: "How long does a refund take?", a: "Once we receive the returned item, refunds are processed within 3–5 business days to your original payment method." },
      { q: "Who pays for return shipping?", a: "If the return is due to our error (wrong/damaged item), we cover shipping. For other returns, the buyer pays return shipping." },
      { q: "Can I exchange an item instead of refund?", a: "Yes — during the return process, select 'Exchange' and choose the replacement item. Exchanges ship within 1–2 business days." },
    ],
  },
  {
    key: "payment",
    icon: CreditCard,
    label: "Payments & Billing",
    color: "#7c3aed",
    articles: [
      { q: "What payment methods are accepted?", a: "We accept Visa, Mastercard, American Express, and bank transfer. Payment is processed securely via our payment provider." },
      { q: "Is my payment information safe?", a: "Yes. We use TLS encryption and never store full card details on our servers. Payments are PCI-DSS compliant." },
      { q: "Why was my payment declined?", a: "Common reasons: incorrect card details, insufficient funds, or bank security block. Contact your bank or try a different payment method." },
      { q: "Can I get an invoice for my order?", a: "Yes — go to My Orders, select the order, and click 'Download Invoice' to get a PDF invoice." },
    ],
  },
  {
    key: "sellers",
    icon: Store,
    label: "Selling on Marketplace",
    color: "#d97706",
    articles: [
      { q: "How do I become a seller?", a: "Apply via the 'Become a Seller' page. Fill in store details and wait for admin approval (usually within 24 hours)." },
      { q: "What are the seller subscription plans?", a: "We offer Starter, Growth, and Pro plans. Each unlocks more product listings and features. See the Pricing page for details." },
      { q: "How do I receive payments as a seller?", a: "Earnings are settled to your registered bank account on a weekly basis, after deducting platform fees." },
      { q: "Can I have multiple stores?", a: "Currently each account is limited to one merchant store. Contact support if you have a business need for multiple stores." },
    ],
  },
  {
    key: "account",
    icon: Shield,
    label: "Account & Security",
    color: "#0891b2",
    articles: [
      { q: "How do I reset my password?", a: "Go to Login → 'Forgot Password' → enter your email. You'll receive a reset link within 5 minutes." },
      { q: "How do I update my personal information?", a: "Visit Profile Settings from the top navigation. You can update name, email, phone, and address details." },
      { q: "How do I delete my account?", a: "Contact our support team. Note: accounts with pending orders or seller obligations cannot be deleted until resolved." },
      { q: "I didn't receive my verification email.", a: "Check spam/junk folder. You can also resend it from the Login page. If still missing, contact support." },
    ],
  },
];

type OpenMap = Record<string, boolean>;

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<OpenMap>({});

  const toggleItem = (key: string) =>
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        !search ||
        a.q.toLowerCase().includes(search.toLowerCase()) ||
        a.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => !search || cat.articles.length > 0);

  const displayCategories = activeCategory
    ? filteredCategories.filter((c) => c.key === activeCategory)
    : filteredCategories;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 border-[24px] border-[var(--red)]/10 rounded-full" />
        <div className="absolute -bottom-20 left-40 w-40 h-40 border-[18px] border-white/5 rounded-full" />
        <div className="max-w-[760px] mx-auto relative z-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
            Support
          </span>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[52px] leading-tight mt-2 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How can we <span className="text-[var(--red)]">help?</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px] mb-8">
            Search our knowledge base or browse by topic below.
          </p>
          <div className="relative max-w-[520px] mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--charcoal-soft)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for help…"
              className="pl-10 h-12 text-[15px] bg-white/10 border-white/20 text-white placeholder:text-[var(--charcoal-soft)] focus:bg-white/15"
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      {!search && (
        <div className="bg-[var(--charcoal-mid)] border-b border-white/5 px-4 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                !activeCategory
                  ? "bg-[var(--red)] text-white"
                  : "bg-white/10 text-[var(--charcoal-soft)] hover:bg-white/20 hover:text-white"
              }`}
            >
              All Topics
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.key ? null : cat.key
                    )
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    activeCategory === cat.key
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-[var(--charcoal-soft)] hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-14">
        {displayCategories.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-14 h-14 text-[var(--charcoal)]/10 mx-auto mb-4" />
            <p className="text-[var(--charcoal-soft)] text-lg font-semibold">
              No results for &ldquo;{search}&rdquo;
            </p>
            <p className="text-[var(--charcoal-soft)]/70 text-sm mt-1">
              Try different keywords or contact support below.
            </p>
          </div>
        )}

        {/* Popular Articles */}
        {!search && !activeCategory && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block w-6 h-px" style={{ background: "var(--red)" }} />
              <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--charcoal-soft)]">
                Popular Articles
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { q: "How do I track my order?", cat: "orders", icon: "🚚" },
                { q: "What is the return policy?", cat: "returns", icon: "↩️" },
                { q: "What payment methods are accepted?", cat: "payment", icon: "💳" },
                { q: "How do I become a seller?", cat: "sellers", icon: "🏪" },
                { q: "How long does delivery take?", cat: "shipping", icon: "📦" },
                { q: "How do I reset my password?", cat: "account", icon: "🔑" },
              ].map((article) => {
                const category = CATEGORIES.find((c) => c.key === article.cat);
                const articleData = category?.articles.find((a) => a.q === article.q);
                return (
                  <button
                    key={article.q}
                    onClick={() => {
                      setActiveCategory(article.cat);
                      setOpenItems((prev) => ({ ...prev, [`${article.cat}-${article.q}`]: true }));
                    }}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black/5 hover:border-[var(--charcoal)]/20 hover:shadow-sm transition-all text-left group"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--charcoal)] group-hover:text-[var(--red)] transition-colors leading-snug">
                        {article.q}
                      </p>
                      {articleData && (
                        <p className="text-[12px] text-[var(--charcoal-soft)] mt-1 line-clamp-2">
                          {articleData.a}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--charcoal-mist)] group-hover:text-[var(--red)] flex-shrink-0 mt-0.5 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {displayCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm"
              >
                <div
                  className="flex items-center gap-3 px-6 py-4 border-b border-black/5"
                  style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: cat.color + "15" }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: cat.color }} />
                  </div>
                  <h2 className="text-[15px] font-bold text-[var(--charcoal)]">
                    {cat.label}
                  </h2>
                  <span className="ml-auto text-[12px] text-[var(--charcoal-soft)] font-medium">
                    {cat.articles.length} articles
                  </span>
                </div>
                <div className="divide-y divide-black/5">
                  {cat.articles.map((art, idx) => {
                    const key = `${cat.key}-${idx}`;
                    const isOpen = !!openItems[key];
                    return (
                      <div key={idx}>
                        <button
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-black/[0.02] transition-colors"
                          onClick={() => toggleItem(key)}
                        >
                          <span className="text-[14px] font-semibold text-[var(--charcoal)] pr-4">
                            {art.q}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 text-[var(--charcoal-soft)] transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-[13.5px] text-[var(--charcoal-soft)] leading-relaxed">
                              {art.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact bar */}
        <div className="mt-16 bg-[var(--charcoal)] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3
              className="text-[var(--off-white)] text-[22px] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Still need help?
            </h3>
            <p className="text-[var(--charcoal-soft)] text-[14px]">
              Our support team is available Monday–Friday, 09:00–18:00 (Turkey time).
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[var(--red)] hover:bg-[var(--red)]/90 text-white px-5 py-2.5 rounded-full font-bold text-[13px] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send a Message
            </Link>
            <a
              href="mailto:support@marketplace.com"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[var(--off-white)] px-5 py-2.5 rounded-full font-bold text-[13px] transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <a
              href="tel:+90850000000"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[var(--off-white)] px-5 py-2.5 rounded-full font-bold text-[13px] transition-colors"
            >
              <Phone className="w-4 h-4" />
              0850 000 00 00
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
