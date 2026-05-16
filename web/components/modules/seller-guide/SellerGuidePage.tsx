"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  PackageCheck,
  BarChart3,
  Puzzle,
  Truck,
  ShieldCheck,
  ArrowRight,
  CircleDot,
  ChevronDown,
  Zap,
  Users,
  TrendingUp,
  CheckCircle2,
  Star,
  Clock,
  CreditCard,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Store,
    title: "Apply for Merchant Account",
    desc: "Fill out the application form with your store name, contact info, and business details. Our team typically reviews and activates your account within 24 hours.",
    link: "/auth/apply-merchant",
    linkLabel: "Apply Now",
    time: "5 minutes",
  },
  {
    number: "02",
    icon: PackageCheck,
    title: "Set Up Your Store",
    desc: "Once approved, configure your store: upload a logo and banner, write a store description, and set a URL-friendly store slug (e.g., /store/mystorename). Your branded e-store is instantly live.",
    link: "/merchant",
    linkLabel: "Go to Dashboard",
    time: "15 minutes",
  },
  {
    number: "03",
    icon: PackageCheck,
    title: "Add Your Products",
    desc: "Create product listings from the Merchant Dashboard. Enter product name, images, description, category, price, and stock quantity. Each product belongs exclusively to you — one seller, one price.",
    link: "/merchant/catalogue",
    linkLabel: "Catalogue Management",
    time: "3–5 min per product",
  },
  {
    number: "04",
    icon: Store,
    title: "Publish to Marketplace",
    desc: "On Pro and Enterprise plans, simply toggle the 'Publish to Marketplace' option on any product to reach all platform buyers, in addition to your e-store visitors.",
    link: "/subscriptions/plans",
    linkLabel: "Review Plans",
    time: "Single click",
  },
  {
    number: "05",
    icon: Truck,
    title: "Fulfill Orders",
    desc: "When a customer places an order, it appears in your Orders dashboard. Pack the item and mark it as ready. The admin assigns a courier, generates a shipping label (QR-coded PDF), and delivery tracking starts automatically.",
    link: "/merchant/orders",
    linkLabel: "View Orders",
    time: "~10 min per order",
  },
  {
    number: "06",
    icon: BarChart3,
    title: "Track Your Performance",
    desc: "See product-specific sales, revenue trends, and e-store vs. marketplace comparisons in your Analytics dashboard. Pro+ plans unlock full analytics and custom reporting.",
    link: "/merchant/analytics",
    linkLabel: "View Analytics",
    time: "Continuous",
  },
];

const TIPS = [
  {
    icon: ShieldCheck,
    title: "Create High-Quality Listings",
    desc: "Use high-resolution images and accurate descriptions. Products go through admin approval before going live — ensure your listings are honest.",
  },
  {
    icon: Truck,
    title: "Keep Stock Updated",
    desc: "Regularly update your stock quantities. Orders for out-of-stock items are automatically rejected and will negatively impact your store rating.",
  },
  {
    icon: Puzzle,
    title: "Extend with Plugins",
    desc: "Pro and Enterprise sellers can install plugins from the Plugin Marketplace — invoice customization, advanced shipping integrations, and more.",
  },
  {
    icon: BarChart3,
    title: "Upgrade When It's Time",
    desc: "Start for free with up to 50 products on the Basic plan. Upgrade to Pro to publish to the public marketplace, get a custom subdomain, and unlock advanced analytics.",
  },
];

const ORDER_FLOW = [
  {
    step: "Order Placed",
    desc: "Customer completes the payment (Stripe)",
    color: "var(--charcoal-mist)",
  },
  {
    step: "Packed",
    desc: "Merchant marks the order as packed",
    color: "var(--red)",
  },
  {
    step: "Shipped",
    desc: "Admin assigns a courier & generates shipping label",
    color: "var(--charcoal-mist)",
  },
  {
    step: "Delivered",
    desc: "Courier confirms delivery — order is completed",
    color: "var(--charcoal-mist)",
  },
];

const PLANS = [
  {
    name: "Basic",
    price: "Free",
    products: "50",
    marketplace: false,
    analytics: "Basic",
    subdomain: false,
    plugins: false,
  },
  {
    name: "Pro",
    price: "₺299/mo",
    products: "500",
    marketplace: true,
    analytics: "Advanced",
    subdomain: true,
    plugins: true,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₺799/mo",
    products: "Unlimited",
    marketplace: true,
    analytics: "Full + Custom",
    subdomain: true,
    plugins: true,
  },
];

const FAQS = [
  {
    q: "How long does it take for my application to be approved?",
    a: "Applications are typically reviewed within 24 hours. During peak periods, this may take up to 48 hours. You will be notified of the approval/rejection decision via email.",
  },
  {
    q: "What are the commission rates?",
    a: "Commission rates vary depending on your subscription plan and product category. The full fee schedule can be found in the Merchant Dashboard > Billing section. There are no listing fees — you only pay when you make a sale.",
  },
  {
    q: "When will I receive my payout?",
    a: "Payouts are processed every Monday for sales from the previous week whose return window has closed. The amount is transferred directly to your registered bank account.",
  },
  {
    q: "Can I open multiple stores?",
    a: "Currently, each account is limited to one merchant store. If your business requires multiple stores, please contact our support team.",
  },
  {
    q: "Is it mandatory to publish my products to the marketplace?",
    a: "No. This is an optional feature available on Pro and higher plans. You can choose to sell exclusively on your own e-store or leverage both channels.",
  },
];

export default function SellerGuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <Store className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              For Sellers
            </span>
          </div>
          <h1
            className="text-[40px] lg:text-[64px] text-white leading-tight mb-4 max-w-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seller <span style={{ color: "var(--red)" }}>Guide</span>
          </h1>
          <p
            className="text-base max-w-xl leading-relaxed mb-8"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            From merchant account application to product listing, order
            fulfillment, and scaling — everything you need to become a
            successful seller.
          </p>
          <div className="flex flex-wrap gap-6 mb-8">
            {[
              { icon: Users, label: "2,400+ Active Sellers" },
              { icon: TrendingUp, label: "Zero Listing Fees" },
              { icon: Zap, label: "24-Hour Application Review" },
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
          <Link
            href="/auth/apply-merchant"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
          >
            Apply as a Seller <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-16 space-y-20">
        {/* Steps */}
        <section>
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Step by Step
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              How Do You Start?
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-[28px] top-10 bottom-10 w-px hidden lg:block"
              style={{ background: "var(--border-light)" }}
            />
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex gap-6 items-start">
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className="w-14 h-14 rounded-2xl p-5 flex items-center justify-center"
                        style={{
                          background: i === 0 ? "var(--red)" : "var(--white)",
                          border: `1.5px solid ${i === 0 ? "var(--red)" : "var(--border-light)"}`,
                          boxShadow:
                            i === 0 ? "var(--shadow-red)" : "var(--shadow-sm)",
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{
                            color: i === 0 ? "white" : "var(--charcoal-soft)",
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
                          className="text-xs px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1"
                          style={{
                            background: "var(--off-white-2)",
                            color: "var(--charcoal-mist)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                          }}
                        >
                          <Clock className="w-3 h-3" /> {step.time}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{
                          color: "var(--charcoal-soft)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {step.desc}
                      </p>
                      <Link
                        href={step.link}
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{
                          color: "var(--red)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {step.linkLabel} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Order Flow */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Order Flow
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Order → Delivery
            </h2>
            <p
              className="text-sm"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Every order on the platform goes through a four-stage process. As
              a merchant, your responsibility is the{" "}
              <strong style={{ color: "var(--charcoal)" }}>Packed</strong> step.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-0">
            {ORDER_FLOW.map((item, idx) => (
              <div
                key={item.step}
                className="flex sm:flex-row flex-col items-center flex-1"
              >
                <div
                  className="flex flex-col items-center text-center rounded-2xl p-5 flex-1 w-full"
                  style={{
                    background: "var(--white)",
                    border: `1.5px solid ${idx === 1 ? "var(--red)" : "var(--border-light)"}`,
                    boxShadow:
                      idx === 1 ? "var(--shadow-md)" : "var(--shadow-xs)",
                  }}
                >
                  <CircleDot
                    className="w-5 h-5 mb-2"
                    style={{
                      color: idx === 1 ? "var(--red)" : "var(--charcoal-mist)",
                    }}
                  />
                  <p
                    className="font-bold text-sm mb-1"
                    style={{
                      color: idx === 1 ? "var(--red)" : "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.step}
                  </p>
                  <p
                    className="text-xs leading-tight"
                    style={{
                      color: "var(--charcoal-soft)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.desc}
                  </p>
                  {idx === 1 && (
                    <span
                      className="mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--red-muted)",
                        color: "var(--red)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Your Step
                    </span>
                  )}
                </div>
                {idx < ORDER_FLOW.length - 1 && (
                  <div
                    className="text-muted-foreground px-2 text-lg hidden sm:block"
                    style={{ color: "var(--charcoal-mist)" }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Plans comparison */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Plans
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Subscription Plans
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-6 relative"
                style={{
                  background: plan.popular ? "var(--charcoal)" : "var(--white)",
                  border: `1.5px solid ${plan.popular ? "var(--red)" : "var(--border-light)"}`,
                  boxShadow: plan.popular
                    ? "var(--shadow-lg)"
                    : "var(--shadow-sm)",
                }}
              >
                {plan.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-white"
                    style={{
                      background: "var(--red)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Most Popular
                  </span>
                )}
                <div className="mb-5">
                  <h3
                    className="font-bold text-base mb-1"
                    style={{
                      color: plan.popular ? "white" : "var(--charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: plan.popular ? "var(--red)" : "var(--charcoal)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {plan.price}
                  </p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {[
                    { label: `${plan.products} Products`, ok: true },
                    { label: "Marketplace Publishing", ok: plan.marketplace },
                    { label: `${plan.analytics} Analytics`, ok: true },
                    { label: "Custom Subdomain", ok: plan.subdomain },
                    { label: "Plugin Access", ok: plan.plugins },
                  ].map(({ label, ok }) => (
                    <li key={label} className="flex items-center gap-2">
                      {ok ? (
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{
                            color: plan.popular
                              ? "var(--red)"
                              : "var(--success)",
                          }}
                        />
                      ) : (
                        <span
                          className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-xs"
                          style={{
                            color: plan.popular
                              ? "rgba(255,255,255,0.3)"
                              : "var(--charcoal-mist)",
                          }}
                        >
                          –
                        </span>
                      )}
                      <span
                        className="text-sm"
                        style={{
                          color: plan.popular
                            ? ok
                              ? "rgba(255,255,255,0.85)"
                              : "rgba(255,255,255,0.35)"
                            : ok
                              ? "var(--charcoal)"
                              : "var(--charcoal-mist)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/subscriptions/plans"
                  className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: plan.popular
                      ? "var(--red)"
                      : "var(--off-white-2)",
                    color: plan.popular ? "white" : "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {plan.name === "Basic" ? "Start for Free" : "Select Plan"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Tips Grid */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Tips
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Tips for Success
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {TIPS.map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="rounded-2xl p-5 flex gap-4"
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--red-muted)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-sm mb-1"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {tip.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {tip.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
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
              Seller-Specific Questions
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

        {/* CTA */}
        <section
          className="rounded-2xl p-8 lg:p-10"
          style={{ background: "var(--charcoal)" }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5" style={{ color: "var(--red)" }} />
                <span
                  className="font-mono text-[10px] uppercase tracking-[3px]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Ready to Start?
                </span>
              </div>
              <h3
                className="text-[24px] lg:text-[32px] text-white mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Open Your Store
              </h3>
              <p
                className="text-sm"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Apply in minutes. The Basic plan is free — no credit card
                required.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/apply-merchant"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: "var(--red)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Merchant Application <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/subscriptions/plans"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Review Plans
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
