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
} from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email Us",
    desc: "Our team responds within 24 hours on business days.",
    value: "support@marketplace.com",
    href: "mailto:support@marketplace.com",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "Call Us",
    desc: "Mon–Fri, 09:00 – 18:00 (GMT+3)",
    value: "+90 (212) 000 00 00",
    href: "tel:+902120000000",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "Visit Us",
    desc: "Our headquarters in Istanbul.",
    value: "Levent, Istanbul, Turkey",
    href: "#",
  },
];

const TOPICS = [
  "Order Issue",
  "Return / Refund",
  "Seller Inquiry",
  "Technical Problem",
  "Billing & Payment",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Get in Touch
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Contact <span className="text-[var(--red)]">Us</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px]">
            Have a question or need help? We're here for you.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-14">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Left — Form */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Send a Message
              </span>
            </div>

            {submitted ? (
              <div
                className="bg-white rounded-2xl p-10 text-center"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                }}
              >
                <CheckCircle2
                  className="w-14 h-14 mx-auto mb-5"
                  style={{ color: "#2d7a4f" }}
                />
                <h2
                  className="text-2xl font-normal mb-3 text-[var(--charcoal)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Message <em style={{ color: "var(--red)" }}>Sent!</em>
                </h2>
                <p className="text-[var(--charcoal-soft)] mb-6">
                  Thanks for reaching out, {form.name}. We'll get back to you at{" "}
                  <strong>{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", topic: "", message: "" });
                  }}
                  className="font-mono text-[11px] uppercase tracking-wider text-[var(--red)] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-8 space-y-5"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                }}
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block font-mono text-[11px] uppercase tracking-wider mb-2"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Jane Smith"
                      className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "var(--off-white)",
                        border: "1.5px solid rgba(51,51,51,0.15)",
                        fontFamily: "var(--font-body)",
                        color: "var(--charcoal)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--charcoal)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(51,51,51,0.15)")
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block font-mono text-[11px] uppercase tracking-wider mb-2"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="jane@example.com"
                      className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "var(--off-white)",
                        border: "1.5px solid rgba(51,51,51,0.15)",
                        fontFamily: "var(--font-body)",
                        color: "var(--charcoal)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--charcoal)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(51,51,51,0.15)")
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block font-mono text-[11px] uppercase tracking-wider mb-2"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    Topic *
                  </label>
                  <select
                    required
                    value={form.topic}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, topic: e.target.value }))
                    }
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--off-white)",
                      border: "1.5px solid rgba(51,51,51,0.15)",
                      fontFamily: "var(--font-body)",
                      color: form.topic
                        ? "var(--charcoal)"
                        : "var(--charcoal-soft)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--charcoal)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(51,51,51,0.15)")
                    }
                  >
                    <option value="">Select a topic</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block font-mono text-[11px] uppercase tracking-wider mb-2"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="Tell us how we can help you..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{
                      background: "var(--off-white)",
                      border: "1.5px solid rgba(51,51,51,0.15)",
                      fontFamily: "var(--font-body)",
                      color: "var(--charcoal)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--charcoal)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(51,51,51,0.15)")
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all disabled:opacity-70"
                  style={{
                    background: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) =>
                    !loading &&
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--red)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--charcoal)")
                  }
                >
                  {loading ? (
                    <span className="font-mono text-[12px]">Sending…</span>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right — Contact info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Contact Details
              </span>
            </div>

            {CONTACT_ITEMS.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="flex items-start gap-5 p-6 rounded-2xl bg-white block transition-all"
                style={{ border: "1px solid rgba(51,51,51,0.08)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(200,16,46,0.2)";
                  el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(51,51,51,0.08)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: "rgba(200,16,46,0.08)",
                    color: "var(--red)",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3
                    className="font-bold text-[var(--charcoal)] mb-0.5"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[0.8125rem] text-[var(--charcoal-soft)] mb-1">
                    {item.desc}
                  </p>
                  <span className="font-mono text-[12px] font-bold text-[var(--charcoal)]">
                    {item.value}
                  </span>
                </div>
              </a>
            ))}

            {/* Response time banner */}
            <div
              className="flex items-center gap-4 p-5 rounded-2xl"
              style={{
                background: "rgba(200,16,46,0.04)",
                border: "1px solid rgba(200,16,46,0.12)",
              }}
            >
              <Clock
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "var(--red)" }}
              />
              <div>
                <p
                  className="font-bold text-[var(--charcoal)] text-sm"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Average Response Time
                </p>
                <p className="font-mono text-[11px] text-[var(--charcoal-soft)]">
                  Under 4 hours during business days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
