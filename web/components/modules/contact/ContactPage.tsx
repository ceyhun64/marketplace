"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  Headphones,
  Package,
  RotateCcw,
  CreditCard,
  Store,
  HelpCircle,
} from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email",
    desc: "We respond within 24 hours on business days.",
    value: "support@bazr.com",
    href: "mailto:support@bazr.com",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "Phone",
    desc: "Mon–Fri, 09:00–18:00 (UTC+3)",
    value: "+90 (212) 000 00 00",
    href: "tel:+902120000000",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "Address",
    desc: "Headquarters",
    value: "Levent, Istanbul, Turkey",
    href: "#",
  },
];

const TOPICS = [
  { value: "order", label: "Order Issue", icon: Package },
  { value: "return", label: "Return / Refund", icon: RotateCcw },
  { value: "seller", label: "Seller Application", icon: Store },
  { value: "technical", label: "Technical Issue", icon: HelpCircle },
  { value: "billing", label: "Payment & Billing", icon: CreditCard },
  { value: "other", label: "Other", icon: MessageSquare },
];

const FAQS = [
  {
    q: "What is your response time?",
    a: "We respond to email inquiries within an average of 2–4 hours on business days. Live chat and phone support are active Monday–Friday between 09:00–18:00.",
  },
  {
    q: "I have an urgent issue, what should I do?",
    a: "For urgent order and delivery issues, please call our hotline. Outside of working hours, submit a form by selecting 'Urgent' as the topic — it will be handled with priority.",
  },
  {
    q: "Is there a different channel for merchant support?",
    a: "After logging in with your approved merchant account, you can open a priority support ticket from the Support section within the Merchant Dashboard.",
  },
];

const HOURS = [
  { day: "Monday – Friday", time: "09:00 – 18:00", open: true },
  { day: "Saturday", time: "10:00 – 14:00", open: true },
  { day: "Sunday", time: "Closed", open: false },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    orderId: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <MessageSquare
              className="w-4 h-4"
              style={{ color: "var(--red)" }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Contact
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[56px] leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How Can We <span style={{ color: "var(--red)" }}>Help</span> You?
          </h1>
          <p
            className="text-sm max-w-lg leading-relaxed"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            Our support team responds within 2 hours on average. Fill out the
            form below or contact us directly.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          {/* Left: Form */}
          <div>
            {/* Topic selector */}
            <div className="mb-8">
              <h2
                className="font-bold text-base mb-4"
                style={{
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Select a Topic
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TOPICS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, topic: value }))}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl text-left transition-all"
                    style={{
                      background:
                        form.topic === value
                          ? "var(--charcoal)"
                          : "var(--white)",
                      border: `1.5px solid ${form.topic === value ? "var(--charcoal)" : "var(--border-light)"}`,
                      boxShadow:
                        form.topic === value
                          ? "var(--shadow-md)"
                          : "var(--shadow-xs)",
                    }}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color:
                          form.topic === value
                            ? "var(--red)"
                            : "var(--charcoal-mist)",
                      }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          form.topic === value ? "white" : "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    {
                      field: "name",
                      label: "Full Name",
                      placeholder: "John Doe",
                      type: "text",
                    },
                    {
                      field: "email",
                      label: "Email Address",
                      placeholder: "john@example.com",
                      type: "email",
                    },
                  ].map(({ field, label, placeholder, type }) => (
                    <div key={field}>
                      <label
                        className="block text-xs font-semibold mb-1.5"
                        style={{
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {label}
                      </label>
                      <input
                        type={type}
                        value={(form as any)[field]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [field]: e.target.value }))
                        }
                        placeholder={placeholder}
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: "var(--white)",
                          border: "1.5px solid var(--border-light)",
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "var(--red)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor =
                            "var(--border-light)")
                        }
                      />
                    </div>
                  ))}
                </div>

                {(form.topic === "order" || form.topic === "return") && (
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Order Number (optional)
                    </label>
                    <input
                      type="text"
                      value={form.orderId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, orderId: e.target.value }))
                      }
                      placeholder="ORD-123456"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "var(--white)",
                        border: "1.5px solid var(--border-light)",
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--red)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "var(--border-light)")
                      }
                    />
                  </div>
                )}

                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Your Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="Please describe your issue in as much detail as possible..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{
                      background: "var(--white)",
                      border: "1.5px solid var(--border-light)",
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--red)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-light)")
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
                  style={{
                    background: loading ? "var(--charcoal-mist)" : "var(--red)",
                    fontFamily: "var(--font-body)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: "var(--success-bg)" }}
                >
                  <CheckCircle2
                    className="w-8 h-8"
                    style={{ color: "var(--success)" }}
                  />
                </div>
                <h3
                  className="text-[22px] mb-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--charcoal)",
                  }}
                >
                  Message Received
                </h3>
                <p
                  className="text-sm max-w-sm"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Our team will get back to you as soon as possible. Our average
                  response time on business days is{" "}
                  <strong style={{ color: "var(--charcoal)" }}>
                    2–4 hours
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* FAQ mini */}
            <div className="mt-10">
              <h2
                className="font-bold text-base mb-4"
                style={{
                  color: "var(--charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Frequently Asked Questions
              </h2>
              <div className="space-y-2">
                {FAQS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "var(--white)",
                      border: `1.5px solid ${openFaq === i ? "var(--red)" : "var(--border-light)"}`,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
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
                            openFaq === i
                              ? "var(--red)"
                              : "var(--charcoal-mist)",
                          transform:
                            openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </button>
                    {openFaq === i && (
                      <div
                        className="px-4 pb-4"
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                      >
                        <p
                          className="text-sm leading-relaxed pt-3"
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
            </div>
          </div>

          {/* Right: Contact info + hours */}
          <div className="space-y-5">
            {/* Contact methods */}
            {CONTACT_ITEMS.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="flex items-start gap-4 p-5 rounded-2xl transition-all block"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-xs)",
                  textDecoration: "none",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--red-muted)",
                    color: "var(--red)",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <p
                    className="font-bold text-sm mb-0.5"
                    style={{
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-xs mb-1"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.desc}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </a>
            ))}

            {/* Support hours */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: "var(--red)" }} />
                <h3
                  className="font-bold text-sm"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Working Hours
                </h3>
              </div>
              <div className="space-y-2.5">
                {HOURS.map(({ day, time, open }) => (
                  <div key={day} className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {day}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: open
                          ? "var(--charcoal)"
                          : "var(--charcoal-mist)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {time}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 pt-4 flex items-center gap-2"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--success)" }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Support team is currently online
                </span>
              </div>
            </div>

            {/* Priority support for merchants */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--charcoal)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Headphones
                  className="w-4 h-4"
                  style={{ color: "var(--red)" }}
                />
                <h3
                  className="font-bold text-sm text-white"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Priority Support for Merchants
                </h3>
              </div>
              <p
                className="text-xs leading-relaxed mb-4"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Open a priority support ticket via the dashboard with your
                approved merchant account. Average response time: 1 hour.
              </p>
              <a
                href="/merchant"
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
              >
                Go to Dashboard →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
