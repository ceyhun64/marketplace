"use client";

import { useState, useRef, useEffect } from "react";
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
  X,
  Send,
  Bot,
  User,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  LifeBuoy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  {
    key: "orders",
    icon: ShoppingCart,
    label: "Orders & Checkout",
    color: "var(--red)",
    articles: [
      {
        q: "How do I place an order?",
        a: "Browse products, add to cart, proceed to checkout, enter shipping address and payment info, then confirm.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "You can cancel within 30 minutes of placing if it hasn't been processed. Go to Orders → select order → Cancel.",
      },
      {
        q: "How do I track my order?",
        a: "Visit /track and enter your tracking number, or go to My Orders and click the order to see real-time status.",
      },
      {
        q: "What if I receive the wrong item?",
        a: "Contact us within 48 hours via the Orders page. We'll arrange a return and resend the correct item at no cost.",
      },
    ],
  },
  {
    key: "shipping",
    icon: Truck,
    label: "Shipping & Delivery",
    color: "#2563eb",
    articles: [
      {
        q: "How long does delivery take?",
        a: "Standard shipping is 2–5 business days. Express shipping is 1–2 business days. Delivery times vary by seller location.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Orders over $500 qualify for free standard shipping. Promotional free shipping events are announced on our Deals page.",
      },
      {
        q: "Can I ship to multiple addresses?",
        a: "Currently each order ships to a single address. Place separate orders for different addresses.",
      },
      {
        q: "What are the shipping carriers?",
        a: "We work with Yurtiçi Kargo, Aras Kargo, and MNG Kargo. Your tracking number will indicate the carrier.",
      },
    ],
  },
  {
    key: "returns",
    icon: RefreshCw,
    label: "Returns & Refunds",
    color: "#059669",
    articles: [
      {
        q: "What is the return policy?",
        a: "Most items can be returned within 14 days of delivery, unused and in original packaging. Visit our Returns page for details.",
      },
      {
        q: "How long does a refund take?",
        a: "Once we receive the returned item, refunds are processed within 3–5 business days to your original payment method.",
      },
      {
        q: "Who pays for return shipping?",
        a: "If the return is due to our error (wrong/damaged item), we cover shipping. For other returns, the buyer pays return shipping.",
      },
      {
        q: "Can I exchange an item instead of refund?",
        a: "Yes — during the return process, select 'Exchange' and choose the replacement item. Exchanges ship within 1–2 business days.",
      },
    ],
  },
  {
    key: "payment",
    icon: CreditCard,
    label: "Payments & Billing",
    color: "#7c3aed",
    articles: [
      {
        q: "What payment methods are accepted?",
        a: "We accept Visa, Mastercard, American Express, and bank transfer. Payment is processed securely via our payment provider.",
      },
      {
        q: "Is my payment information safe?",
        a: "Yes. We use TLS encryption and never store full card details on our servers. Payments are PCI-DSS compliant.",
      },
      {
        q: "Why was my payment declined?",
        a: "Common reasons: incorrect card details, insufficient funds, or bank security block. Contact your bank or try a different payment method.",
      },
      {
        q: "Can I get an invoice for my order?",
        a: "Yes — go to My Orders, select the order, and click 'Download Invoice' to get a PDF invoice.",
      },
    ],
  },
  {
    key: "sellers",
    icon: Store,
    label: "Selling on Marketplace",
    color: "#d97706",
    articles: [
      {
        q: "How do I become a seller?",
        a: "Apply via the 'Become a Seller' page. Fill in store details and wait for admin approval (usually within 24 hours).",
      },
      {
        q: "What are the seller subscription plans?",
        a: "We offer Starter, Growth, and Pro plans. Each unlocks more product listings and features. See the Pricing page for details.",
      },
      {
        q: "How do I receive payments as a seller?",
        a: "Earnings are settled to your registered bank account on a weekly basis, after deducting platform fees.",
      },
      {
        q: "Can I have multiple stores?",
        a: "Currently each account is limited to one merchant store. Contact support if you have a business need for multiple stores.",
      },
    ],
  },
  {
    key: "account",
    icon: Shield,
    label: "Account & Security",
    color: "#0891b2",
    articles: [
      {
        q: "How do I reset my password?",
        a: "Go to Login → 'Forgot Password' → enter your email. You'll receive a reset link within 5 minutes.",
      },
      {
        q: "How do I update my personal information?",
        a: "Visit Profile Settings from the top navigation. You can update name, email, phone, and address details.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact our support team. Note: accounts with pending orders or seller obligations cannot be deleted until resolved.",
      },
      {
        q: "I didn't receive my verification email.",
        a: "Check spam/junk folder. You can also resend it from the Login page. If still missing, contact support.",
      },
    ],
  },
];

type OpenMap = Record<string, boolean>;

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

const BOT_REPLIES: Record<string, string> = {
  default:
    "I'm the BAZR support assistant. I can help with orders, shipping, returns, payments, and account issues. What do you need help with?",
  order:
    "For order issues, go to My Orders in your account. You can track, cancel (within 30 min), or report a problem there. Anything specific about your order?",
  shipping:
    "Standard shipping takes 2–5 business days. Express is 1–2 days. You can track your shipment at /track or via My Orders. Need more details?",
  return:
    "You can return most items within 14 days of delivery in original condition. Start a return from My Orders → select the order → Return item.",
  payment:
    "We accept Visa, Mastercard, Amex, and bank transfer. All payments are PCI-DSS compliant. What payment issue are you experiencing?",
  password:
    "Go to the Login page and click 'Forgot Password'. Enter your email and you'll receive a reset link within 5 minutes.",
  seller:
    "To become a seller, click 'Become a Seller' in the top navigation and complete the application. Approval usually takes under 24 hours.",
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("order") || lower.includes("cancel"))
    return BOT_REPLIES.order;
  if (
    lower.includes("ship") ||
    lower.includes("deliver") ||
    lower.includes("track")
  )
    return BOT_REPLIES.shipping;
  if (
    lower.includes("return") ||
    lower.includes("refund") ||
    lower.includes("exchange")
  )
    return BOT_REPLIES.return;
  if (
    lower.includes("pay") ||
    lower.includes("card") ||
    lower.includes("invoice") ||
    lower.includes("bill")
  )
    return BOT_REPLIES.payment;
  if (
    lower.includes("password") ||
    lower.includes("login") ||
    lower.includes("account")
  )
    return BOT_REPLIES.password;
  if (
    lower.includes("sell") ||
    lower.includes("merchant") ||
    lower.includes("store")
  )
    return BOT_REPLIES.seller;
  return BOT_REPLIES.default;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "rgba(200,16,46,0.15)",
          color: "var(--red)",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const POPULAR_ARTICLES: { q: string; cat: string }[] = [
  { q: "How do I track my order?", cat: "orders" },
  { q: "What is the return policy?", cat: "returns" },
  { q: "What payment methods are accepted?", cat: "payment" },
  { q: "How do I become a seller?", cat: "sellers" },
  { q: "How long does delivery take?", cat: "shipping" },
  { q: "How do I reset my password?", cat: "account" },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<OpenMap>({});

  // Ticket modal
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketCategory, setTicketCategory] = useState("orders");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "bot", text: BOT_REPLIES.default },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen, chatMinimized]);

  const toggleItem = (key: string) =>
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        !search ||
        a.q.toLowerCase().includes(search.toLowerCase()) ||
        a.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => !search || cat.articles.length > 0);

  const displayCategories = activeCategory
    ? filteredCategories.filter((c) => c.key === activeCategory)
    : filteredCategories;

  const handleTicketSubmit = async () => {
    if (!ticketSubject || !ticketDesc || !ticketEmail) return;
    setTicketLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTicketLoading(false);
    setTicketSubmitted(true);
  };

  const resetTicket = () => {
    setTicketSubject("");
    setTicketDesc("");
    setTicketEmail("");
    setTicketCategory("orders");
    setTicketSubmitted(false);
    setTicketOpen(false);
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    setChatTyping(true);
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    setChatTyping(false);
    setChatMessages((prev) => [
      ...prev,
      { role: "bot", text: getBotReply(msg) },
    ]);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero — teal/support identity ─────────────────────────────────────── */}
      <div
        className="py-16 px-4 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #071a1f 0%, #0a2330 50%, #071a1f 100%)",
        }}
      >
        {/* Decorative rings */}
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ border: "24px solid rgba(6,182,212,0.09)" }}
        />
        <div
          className="absolute -bottom-20 left-40 w-40 h-40 rounded-full pointer-events-none"
          style={{ border: "18px solid rgba(6,182,212,0.06)" }}
        />
        {/* LifeBuoy watermark */}
        <LifeBuoy
          className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ width: 150, height: 150, color: "rgba(6,182,212,0.06)" }}
        />
        {/* Bottom accent */}
        <div
          className="absolute bottom-0 left-0 w-full h-0.5 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,182,212,0.5) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-[760px] mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <LifeBuoy
              style={{ width: 14, height: 14, color: "rgba(6,182,212,0.9)" }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "rgba(6,182,212,0.7)" }}
            >
              Support Center
            </span>
          </div>
          <h1
            className="text-white text-[36px] lg:text-[52px] leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How can we{" "}
            <span style={{ color: "rgba(6,182,212,0.9)" }}>help?</span>
          </h1>
          <p
            className="text-[15px] mb-8"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Search our knowledge base or browse by topic below.
          </p>

          <div className="relative max-w-[520px] mx-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.4)" }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for help…"
              className="pl-10 h-12 text-[15px] bg-white/10 border-white/20 text-white placeholder:text-white/35 focus:bg-white/15 focus:border-white/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                }
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {search && (
            <p
              className="mt-3 text-[13px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {filteredCategories.reduce(
                (sum, c) => sum + c.articles.length,
                0,
              )}{" "}
              result(s) for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────────────────────── */}
      {!search && (
        <div
          className="border-b px-4 py-4"
          style={{
            background: "var(--off-white-2)",
            borderColor: "rgba(30,30,30,0.08)",
          }}
        >
          <div className="max-w-300 mx-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                !activeCategory
                  ? "bg-(--charcoal) text-white border-(--charcoal)"
                  : "bg-white text-(--charcoal-soft) border-black/10 hover:border-(--charcoal) hover:text-(--charcoal)"
              }`}
            >
              All Topics
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.key ? null : cat.key,
                    )
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                    isActive
                      ? "bg-(--charcoal) text-white border-(--charcoal)"
                      : "bg-white text-(--charcoal-soft) border-black/10 hover:border-(--charcoal) hover:text-(--charcoal)"
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

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-300 mx-auto px-4 lg:px-8 py-14">
        {/* Empty state */}
        {displayCategories.length === 0 && (
          <div className="text-center py-20">
            <Search
              className="w-14 h-14 mx-auto mb-4"
              style={{ color: "rgba(30,30,30,0.1)" }}
            />
            <p className="text-(--charcoal-soft) text-lg font-semibold">
              No results for &ldquo;{search}&rdquo;
            </p>
            <p
              className="text-sm mt-1 mb-6"
              style={{ color: "var(--charcoal-mist)" }}
            >
              Try different keywords or submit a support ticket below.
            </p>
            <button
              onClick={() => setTicketOpen(true)}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold text-[13px] transition-colors"
              style={{ background: "var(--red)" }}
            >
              <Ticket className="w-4 h-4" />
              Open a Support Ticket
            </button>
          </div>
        )}

        {/* Popular Articles */}
        {!search && !activeCategory && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-(--charcoal-soft)">
                Popular Articles
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULAR_ARTICLES.map((article) => {
                const category = CATEGORIES.find((c) => c.key === article.cat);
                const articleData = category?.articles.find(
                  (a) => a.q === article.q,
                );
                const Icon = category?.icon;
                return (
                  <button
                    key={article.q}
                    onClick={() => {
                      setActiveCategory(article.cat);
                      setOpenItems((prev) => ({
                        ...prev,
                        [`${article.cat}-${article.q}`]: true,
                      }));
                    }}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black/5 hover:border-(--charcoal)/20 hover:shadow-sm transition-all text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: category
                          ? `${category.color}18`
                          : "rgba(30,30,30,0.06)",
                      }}
                    >
                      {Icon && (
                        <Icon
                          className="w-4 h-4"
                          style={{
                            color: category?.color ?? "var(--charcoal-soft)",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-(--charcoal) group-hover:text-(--red) transition-colors leading-snug">
                        {article.q}
                      </p>
                      {articleData && (
                        <p className="text-[12px] text-(--charcoal-soft) mt-1 line-clamp-2">
                          {articleData.a}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-(--charcoal-mist) group-hover:text-(--red) shrink-0 mt-0.5 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ grid — layout unchanged */}
        <div className="grid md:grid-cols-2 gap-8">
          {displayCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className="bg-white rounded-md border border-black/5 overflow-hidden shadow-sm"
              >
                <div
                  className="flex items-center gap-3 px-6 py-4 border-b border-black/5"
                  style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: cat.color + "15" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <h2 className="text-[15px] font-bold text-(--charcoal)">
                    {cat.label}
                  </h2>
                  <span className="ml-auto text-[12px] text-(--charcoal-soft) font-medium">
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
                          <span className="text-[14px] font-semibold text-(--charcoal) pr-4">
                            {highlightText(art.q, search)}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 text-(--charcoal-soft) transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5">
                            <p className="text-[13.5px] text-(--charcoal-soft) leading-relaxed">
                              {highlightText(art.a, search)}
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

        {/* Contact / Still need help bar */}
        <div
          className="mt-16 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "var(--charcoal)" }}
        >
          <div>
            <h3
              className="text-white text-[22px] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Still need help?
            </h3>
            <p className="text-[14px]" style={{ color: "var(--charcoal-soft)" }}>
              Our support team is available Monday–Friday, 09:00–18:00 (Turkey
              time).
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setTicketOpen(true)}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold text-[13px] transition-all"
              style={{ background: "var(--red)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--red-dark)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--red)")
              }
            >
              <Ticket className="w-4 h-4" />
              Open a Ticket
            </button>
            <button
              onClick={() => {
                setChatOpen(true);
                setChatMinimized(false);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] transition-all"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <MessageCircle className="w-4 h-4" />
              Live Chat
            </button>
            <a
              href="mailto:support@marketplace.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] transition-all"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <a
              href="tel:+90850000000"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] transition-all"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <Phone className="w-4 h-4" />
              0850 000 00 00
            </a>
          </div>
        </div>
      </div>

      {/* ── Ticket Modal ─────────────────────────────────────────────────────── */}
      {ticketOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) resetTicket();
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: "var(--charcoal)" }}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" style={{ color: "var(--red)" }} />
                <span className="font-bold text-white text-[15px]">
                  Open a Support Ticket
                </span>
              </div>
              <button
                onClick={resetTicket}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ticketSubmitted ? (
              <div className="p-10 text-center">
                <CheckCircle2
                  className="w-14 h-14 mx-auto mb-4"
                  style={{ color: "#059669" }}
                />
                <h3
                  className="text-[20px] font-bold text-(--charcoal) mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ticket Submitted!
                </h3>
                <p className="text-[14px] text-(--charcoal-soft) mb-6">
                  We've received your request and will respond to{" "}
                  <strong>{ticketEmail}</strong> within 24 hours.
                </p>
                <button
                  onClick={resetTicket}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--charcoal)" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-(--charcoal) mb-1.5 uppercase tracking-wide">
                    Your Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    className="h-10 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-(--charcoal) mb-1.5 uppercase tracking-wide">
                    Category *
                  </label>
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger className="w-full h-10 rounded-lg text-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-(--charcoal) mb-1.5 uppercase tracking-wide">
                    Subject *
                  </label>
                  <Input
                    placeholder="Brief summary of your issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="h-10 text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-(--charcoal) mb-1.5 uppercase tracking-wide">
                    Description *
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue in detail. Include any order numbers or relevant information."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-[14px] px-3 py-2.5 text-(--charcoal) focus:outline-none focus:ring-2 focus:ring-(--red)/30 resize-none bg-white"
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    disabled={
                      !ticketSubject ||
                      !ticketDesc ||
                      !ticketEmail ||
                      ticketLoading
                    }
                    onClick={handleTicketSubmit}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                    style={{ background: "var(--red)" }}
                  >
                    {ticketLoading ? "Submitting…" : "Submit Ticket"}
                  </button>
                  <button
                    onClick={resetTicket}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-(--charcoal) border border-gray-200 hover:border-(--charcoal) transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {(!ticketSubject || !ticketDesc || !ticketEmail) && (
                  <p className="text-[12px] text-(--charcoal-soft) flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> All fields
                    marked * are required.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chatbot Widget ───────────────────────────────────────────────────── */}
      {chatOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[340px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            border: "1px solid rgba(51,51,51,0.1)",
            maxHeight: chatMinimized ? "auto" : "480px",
          }}
        >
          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
            style={{ background: "var(--charcoal)" }}
            onClick={() => setChatMinimized(!chatMinimized)}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--red)" }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold">
                BAZR Support Bot
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Online · Replies instantly
              </p>
            </div>
            <div className="flex items-center gap-2">
              {chatMinimized ? (
                <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setChatOpen(false);
                }}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!chatMinimized && (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ maxHeight: "340px", background: "#f8f7f5" }}
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background:
                          msg.role === "bot"
                            ? "var(--charcoal)"
                            : "var(--red)",
                      }}
                    >
                      {msg.role === "bot" ? (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div
                      className="max-w-[75%] px-3 py-2 text-[13px] leading-relaxed"
                      style={{
                        background:
                          msg.role === "bot" ? "white" : "var(--red)",
                        color:
                          msg.role === "bot" ? "var(--charcoal)" : "white",
                        borderRadius:
                          msg.role === "bot"
                            ? "4px 16px 16px 16px"
                            : "16px 4px 16px 16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div className="flex gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--charcoal)" }}
                    >
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div
                      className="px-3 py-2 bg-white text-[13px]"
                      style={{
                        borderRadius: "4px 16px 16px 16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      <span className="inline-flex gap-1 items-center">
                        <span
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
                <input
                  className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-(--red)/25 text-(--charcoal)"
                  placeholder="Type your question…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat();
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity"
                  style={{ background: "var(--red)" }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="px-3 pb-3 bg-white">
                <button
                  onClick={() => {
                    setChatOpen(false);
                    setTicketOpen(true);
                  }}
                  className="text-[11px] text-(--charcoal-soft) underline underline-offset-2 hover:text-(--charcoal) transition-colors"
                >
                  Need more help? Open a ticket →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-10 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          style={{ background: "var(--red)" }}
          title="Open live chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}
    </main>
  );
}
