"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  PackageX,
  Clock,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Truck,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Package,
  RefreshCw,
  Search,
  Ticket,
  CircleCheck,
  Loader2,
} from "lucide-react";

const RETURN_STEPS = [
  {
    number: "01",
    icon: Package,
    title: "Create Return Request",
    desc: "Select the relevant order from the My Orders page, click the 'Return Request' button and state the reason for return. Must be done within 14 calendar days from the delivery date.",
    time: "~2 mins",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Approval & Label",
    desc: "Our support team will review your request within 1–2 business days. Once approved, a prepaid shipping label will be sent to your email address.",
    time: "1–2 business days",
  },
  {
    number: "03",
    icon: Truck,
    title: "Ship the Item",
    desc: "Pack the product securely in its original packaging. Attach the label and drop it off at an authorized shipping point. Keep the tracking number.",
    time: "Up to you",
  },
  {
    number: "04",
    icon: CreditCard,
    title: "Return Received & Inspection",
    desc: "Once the product reaches our warehouse, it is inspected within 2–3 business days. If there are no issues, the refund process is initiated.",
    time: "2–3 business days",
  },
  {
    number: "05",
    icon: RefreshCw,
    title: "Refund",
    desc: "The approved refund amount will be credited back to the original payment method within 5–7 business days. A notification email will be sent.",
    time: "5–7 business days",
  },
];

const ELIGIBLE = [
  "Damaged or defective product",
  "Incorrect item/size shipped",
  "Product significantly different from description",
  "Not delivered despite 10 business days passing since shipment",
];

const NOT_ELIGIBLE = [
  "Returns requested after the 14-day window",
  "Customer-inflicted wear, tear, or damage",
  "Digital products, downloadable content, and gift cards",
  "Perishable goods and customized/made-to-order products",
  "Products with opened original packaging due to hygiene reasons",
];

const FAQS = [
  {
    q: "When will I receive my refund?",
    a: "Once the returned item reaches our warehouse, it is inspected within 2–3 business days. After approval, the refund process is initiated and will reflect on your payment method within 5–7 business days depending on your provider. Bank processing times may add an extra 1–3 business days.",
  },
  {
    q: "Can I exchange an item instead of returning it?",
    a: "Currently, returns are only processed as monetary refunds. If you wish to purchase a different item, you can place a new order after your return is approved.",
  },
  {
    q: "My item arrived damaged, what should I do?",
    a: "Take photos of the damaged product and its packaging immediately. Contact us within 14 days with your order number and the photos. A full refund or free replacement will be provided for damaged items.",
  },
  {
    q: "Who covers the return shipping cost?",
    a: "If the error is on our end (damaged, defective, or incorrect product), we provide a prepaid return label. For returns due to a change of mind, the shipping cost belongs to the buyer.",
  },
  {
    q: "I ordered from an independent store, how do I make a return?",
    a: "Regardless of which store you ordered from, all returns are processed centrally through the platform. Contact us, and we will handle the coordination with the respective seller.",
  },
  {
    q: "What happens if my return is rejected?",
    a: "In case of rejection, we will notify you via email and explain the reason. If you wish to contest our decision, you can contact our support team; we review each case individually.",
  },
];

// Simulated ticket statuses
const TICKET_STATUSES: Record<
  string,
  {
    status: string;
    step: number;
    updated: string;
    label: string;
    color: string;
  }
> = {
  "RET-001234": {
    status: "Approved",
    step: 2,
    updated: "May 15, 2026",
    label: "Label sent to your email",
    color: "var(--success)",
  },
  "RET-005678": {
    status: "In Review",
    step: 1,
    updated: "May 16, 2026",
    label: "Our team is reviewing your request",
    color: "#d97706",
  },
  "RET-009999": {
    status: "Refunded",
    step: 5,
    updated: "May 10, 2026",
    label: "Refund processed to your original payment method",
    color: "var(--success)",
  },
};

export default function ReturnsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [ticketResult, setTicketResult] = useState<
    null | "found" | "not_found"
  >(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketData, setTicketData] = useState<
    (typeof TICKET_STATUSES)[string] | null
  >(null);

  const handleTicketCheck = async () => {
    if (!ticketId.trim()) return;
    setTicketLoading(true);
    setTicketResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const found = TICKET_STATUSES[ticketId.trim().toUpperCase()];
    if (found) {
      setTicketData(found);
      setTicketResult("found");
    } else {
      setTicketData(null);
      setTicketResult("not_found");
    }
    setTicketLoading(false);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-16 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,16,46,0.10) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-5">
            <RotateCcw className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Customer Support
            </span>
          </div>
          <h1
            className="text-[40px] lg:text-[64px] text-white leading-tight mb-4 max-w-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Returns & <span style={{ color: "var(--red)" }}>Refunds</span>
          </h1>
          <p
            className="text-base max-w-xl leading-relaxed mb-8"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            We want you to be fully satisfied with every purchase. If there is a
            problem, we will take care of it.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Clock, label: "14-Day Return Window" },
              {
                icon: ShieldCheck,
                label: "Free Return Label (If It's Our Fault)",
              },
              { icon: CreditCard, label: "5–7 Business Days Refund" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "var(--red)" }}
                />
                <span
                  className="text-sm"
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="mx-4 lg:mx-auto max-w-[1300px] -mt-6 relative z-10 rounded-2xl px-6 py-4 flex items-center gap-4"
        style={{
          background: "var(--info-bg)",
          border: "1.5px solid var(--info-border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--info-bg)",
            border: "1px solid var(--info-border)",
          }}
        >
          <Clock className="w-5 h-5" style={{ color: "var(--info)" }} />
        </div>
        <div>
          <p
            className="font-bold text-sm"
            style={{ color: "var(--info)", fontFamily: "var(--font-body)" }}
          >
            14-Day Return Window
          </p>
          <p
            className="text-sm"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            You can request a return within 14 calendar days from the delivery
            date.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-16 space-y-20">
        {/* ── NEW: Return Ticket Tracker ── */}
        <section
          className="rounded-2xl p-6 lg:p-8"
          style={{
            background: "var(--white)",
            border: "1.5px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--red-muted)" }}
            >
              <Ticket className="w-5 h-5" style={{ color: "var(--red)" }} />
            </div>
            <div>
              <h2
                className="font-bold text-base"
                style={{
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Track Your Return Ticket
              </h2>
              <p
                className="text-xs"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Enter your return ticket ID (e.g. RET-001234) to see the latest
                status.
              </p>
            </div>
          </div>
          <div className="flex gap-3 max-w-lg">
            <input
              type="text"
              value={ticketId}
              onChange={(e) => {
                setTicketId(e.target.value);
                setTicketResult(null);
              }}
              placeholder="RET-XXXXXX"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none font-mono"
              style={{
                background: "var(--off-white)",
                border: "1.5px solid var(--border-light)",
                color: "var(--charcoal)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--red)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-light)")
              }
              onKeyDown={(e) => e.key === "Enter" && handleTicketCheck()}
            />
            <button
              onClick={handleTicketCheck}
              disabled={!ticketId.trim() || ticketLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white"
              style={{
                background:
                  ticketId.trim() && !ticketLoading
                    ? "var(--charcoal)"
                    : "var(--charcoal-mist)",
                fontFamily: "var(--font-body)",
                cursor:
                  ticketId.trim() && !ticketLoading ? "pointer" : "not-allowed",
              }}
            >
              {ticketLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {ticketLoading ? "Checking…" : "Track"}
            </button>
          </div>

          {ticketResult === "not_found" && (
            <div
              className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
              }}
            >
              <AlertCircle
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--red)" }}
              />
              <p
                className="text-sm"
                style={{
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                No ticket found for <strong>{ticketId}</strong>. Please
                double-check the ID or{" "}
                <Link
                  href="/contact"
                  style={{ color: "var(--red)" }}
                  className="underline"
                >
                  contact support
                </Link>
                .
              </p>
            </div>
          )}

          {ticketResult === "found" && ticketData && (
            <div
              className="mt-5 rounded-xl p-5"
              style={{
                background: "var(--off-white)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: "var(--charcoal-mist)" }}
                  >
                    {ticketId.toUpperCase()}
                  </span>
                  <p
                    className="font-bold text-sm mt-0.5"
                    style={{
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {ticketData.label}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `${ticketData.color}15`,
                    color: ticketData.color,
                    border: `1px solid ${ticketData.color}30`,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {ticketData.status}
                </span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-1 mb-2">
                {RETURN_STEPS.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1 flex-1">
                    <div
                      className="flex-1 h-1.5 rounded-full"
                      style={{
                        background:
                          idx < ticketData.step
                            ? "var(--red)"
                            : "var(--border-light)",
                      }}
                    />
                    {idx === RETURN_STEPS.length - 1 && (
                      <CircleCheck
                        className="w-4 h-4"
                        style={{
                          color:
                            ticketData.step >= 5
                              ? "var(--success)"
                              : "var(--border-light)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {RETURN_STEPS.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono"
                    style={{
                      color:
                        idx < ticketData.step
                          ? "var(--charcoal-soft)"
                          : "var(--charcoal-mist)",
                    }}
                  >
                    {s.number}
                  </span>
                ))}
              </div>
              <p
                className="text-xs mt-3"
                style={{
                  color: "var(--charcoal-mist)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Last updated: {ticketData.updated}
              </p>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section>
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Process
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              How Does It Work?
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-[28px] top-10 bottom-10 w-px hidden lg:block"
              style={{ background: "var(--border-light)" }}
            />
            <div className="space-y-4">
              {RETURN_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLast = i === RETURN_STEPS.length - 1;
                return (
                  <div key={step.number} className="flex gap-6 items-start">
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isLast ? "var(--red)" : "var(--white)",
                          border: `1.5px solid ${isLast ? "var(--red)" : "var(--border-light)"}`,
                          boxShadow: isLast
                            ? "var(--shadow-red)"
                            : "var(--shadow-sm)",
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{
                            color: isLast ? "white" : "var(--charcoal-soft)",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="flex-1 rounded-2xl p-5"
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        boxShadow: "var(--shadow-xs)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="font-mono text-xs font-bold"
                            style={{ color: "var(--charcoal-mist)" }}
                          >
                            {step.number}
                          </span>
                          <h3
                            className="font-bold text-[0.9375rem]"
                            style={{
                              color: "var(--charcoal)",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            {step.title}
                          </h3>
                        </div>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            background: "var(--off-white-2)",
                            color: "var(--charcoal-mist)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                          }}
                        >
                          {step.time}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          color: "var(--charcoal-soft)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Eligible / Not Eligible */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Eligibility
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              What Can Be Returned?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--success-bg)",
                border: "1.5px solid var(--success-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "var(--success)" }}
                />
                <h3
                  className="font-bold text-sm"
                  style={{
                    color: "var(--success)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Eligible Items
                </h3>
              </div>
              <ul className="space-y-3">
                {ELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-white text-[10px] font-bold"
                      style={{ background: "var(--success)" }}
                    >
                      ✓
                    </span>
                    <span
                      className="text-sm leading-snug"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--danger-bg)",
                border: "1.5px solid var(--danger-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <PackageX
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "var(--red)" }}
                />
                <h3
                  className="font-bold text-sm"
                  style={{
                    color: "var(--red)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Non-Eligible Items
                </h3>
              </div>
              <ul className="space-y-3">
                {NOT_ELIGIBLE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-white text-[10px] font-bold"
                      style={{ background: "var(--red)" }}
                    >
                      ✗
                    </span>
                    <span
                      className="text-sm leading-snug"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Refund methods */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Refund
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Refund Methods
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: CreditCard,
                title: "Credit / Debit Card",
                desc: "Refunded to the card used for payment within 5–7 business days.",
                badge: "Most Common",
              },
              {
                icon: RefreshCw,
                title: "Wallet Credit",
                desc: "Instantly loaded to your BAZR wallet, ready to use for your next purchases.",
                badge: "Fastest",
              },
              {
                icon: ShieldCheck,
                title: "Bank Transfer",
                desc: "If paid via IBAN, refund will be made to the same account within 5–10 business days.",
                badge: null,
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div
                key={title}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--red-muted)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
                  </div>
                  {badge && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--red-muted)",
                        color: "var(--red)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <h3
                  className="font-bold text-sm mb-2"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                FAQ
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--white)",
                  border: `1.5px solid ${openFaq === i ? "var(--red)" : "var(--border-light)"}`,
                  boxShadow:
                    openFaq === i ? "var(--shadow-md)" : "var(--shadow-xs)",
                  transition: "all 0.2s ease",
                }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span
                    className="font-semibold text-sm pr-4"
                    style={{
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 transition-transform"
                    style={{
                      color:
                        openFaq === i ? "var(--red)" : "var(--charcoal-mist)",
                      transform:
                        openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div
                    className="px-5 pb-5"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <p
                      className="text-sm leading-relaxed pt-4"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Support CTA */}
        <section
          className="rounded-2xl p-8 lg:p-10"
          style={{ background: "var(--charcoal)" }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle
                  className="w-5 h-5"
                  style={{ color: "var(--red)" }}
                />
                <span
                  className="font-mono text-[10px] uppercase tracking-[3px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Need Any Help?
                </span>
              </div>
              <h3
                className="text-[24px] lg:text-[32px] text-white mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                We Are Here for You
              </h3>
              <p
                className="text-sm"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Our support team is ready to guide you step by step. Average
                response time:{" "}
                <strong style={{ color: "white" }}>2 hours</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: "var(--red)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Open Support Ticket
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Go to My Orders <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
