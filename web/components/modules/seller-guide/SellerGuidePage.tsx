import Link from "next/link";
import {
  Store,
  PackageCheck,
  BarChart3,
  Puzzle,
  Truck,
  ShieldCheck,
  ArrowRight,
  CircleDot,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Store,
    title: "Apply as a Merchant",
    desc: "Fill out the merchant application form with your store name, contact info, and business details. Our admin team reviews applications and activates your account — typically within 24 hours.",
    link: "/auth/apply-merchant",
    linkLabel: "Apply Now",
  },
  {
    number: "02",
    icon: PackageCheck,
    title: "Set Up Your Store",
    desc: "Once approved, configure your store: upload a logo and banner, write a store description, and pick a URL-friendly slug (e.g. /store/myshop). Your branded e-store is live instantly.",
    link: "/merchant/store-settings",
    linkLabel: "Store Settings",
  },
  {
    number: "03",
    icon: PackageCheck,
    title: "Add Your Products",
    desc: "Create product listings from your Merchant Dashboard. Add product name, images, description, category, sub-category, price, and stock quantity. Each product belongs exclusively to you — one seller, one price.",
    link: "/merchant/catalogue",
    linkLabel: "Manage Catalogue",
  },
  {
    number: "04",
    icon: Store,
    title: "Publish to the Marketplace",
    desc: "On Pro and Enterprise plans, toggle 'Publish to Marketplace' on any product to list it on the public marketplace, reaching all platform shoppers in addition to your e-store visitors.",
    link: "/subscriptions/plans",
    linkLabel: "View Plans",
  },
  {
    number: "05",
    icon: Truck,
    title: "Fulfil Orders",
    desc: "When a customer places an order, you'll see it in your Orders dashboard. Pack the order and mark it as ready. An admin will assign a courier, generate a shipping label (QR-coded PDF), and the delivery tracking starts automatically.",
    link: "/merchant/orders",
    linkLabel: "View Orders",
  },
  {
    number: "06",
    icon: BarChart3,
    title: "Track Your Performance",
    desc: "Your Analytics dashboard shows product-level sales, revenue trends, and a comparison between e-store vs. marketplace traffic. Pro+ plans unlock full analytics and custom reporting.",
    link: "/merchant/analytics",
    linkLabel: "Analytics",
  },
];

const TIPS = [
  {
    icon: ShieldCheck,
    title: "Quality Listings",
    desc: "Use clear, high-resolution images and accurate descriptions. Products go through an admin approval step before going live — keep listings honest.",
  },
  {
    icon: Truck,
    title: "Keep Stock Updated",
    desc: "Update stock quantities regularly. Orders are automatically rejected for out-of-stock items, which negatively impacts your store rating.",
  },
  {
    icon: Puzzle,
    title: "Extend with Plugins",
    desc: "Pro and Enterprise merchants can install plugins from the Plugin Marketplace — including invoice customisation, advanced shipping integrations, and more.",
  },
  {
    icon: BarChart3,
    title: "Upgrade When Ready",
    desc: "Start free with up to 50 products on Basic. Upgrade to Pro to publish to the public marketplace, unlock custom subdomains, and get advanced analytics.",
  },
];

const ORDER_FLOW = [
  { step: "Placed", desc: "Customer completes checkout & payment (Stripe)" },
  { step: "Packed", desc: "Merchant marks order as packed and ready" },
  {
    step: "Dispatched",
    desc: "Admin assigns courier & generates shipping label",
  },
  { step: "Delivered", desc: "Courier confirms delivery — order complete" },
];

export default function SellerGuidePage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
          For Merchants
        </span>
        <h1 className="text-4xl font-bold mb-4">Seller Guide</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Everything you need to start selling — from applying for a merchant
          account to fulfilling your first order and growing with analytics.
        </p>
        <Link
          href="/auth/apply-merchant"
          className="inline-flex items-center gap-2 mt-6 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Start Selling <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Steps */}
      <section className="mb-16">
        <h2 className="text-xl font-bold mb-8">
          Getting Started — Step by Step
        </h2>
        <div className="space-y-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex gap-5 rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {step.desc}
                  </p>
                  <Link
                    href={step.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:text-foreground text-muted-foreground"
                  >
                    {step.linkLabel} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Order Flow */}
      <section className="mb-16">
        <h2 className="text-xl font-bold mb-6">Order → Delivery Flow</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Every order on the platform goes through a four-stage state machine.
          As a merchant, your job is the{" "}
          <strong className="text-foreground">Packed</strong> step.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0">
          {ORDER_FLOW.map((item, idx) => (
            <div
              key={item.step}
              className="flex sm:flex-row flex-col items-center flex-1"
            >
              <div className="flex flex-col items-center text-center bg-card border border-border rounded-xl p-4 flex-1 w-full">
                <CircleDot className="w-5 h-5 mb-2 text-muted-foreground" />
                <p className="font-bold text-sm">{item.step}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {item.desc}
                </p>
              </div>
              {idx < ORDER_FLOW.length - 1 && (
                <div className="text-muted-foreground font-mono px-2 text-lg hidden sm:block">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tips Grid */}
      <section className="mb-16">
        <h2 className="text-xl font-bold mb-6">Tips for Success</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div
                key={tip.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{tip.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gray-900 text-white p-8 text-center">
        <h3 className="text-xl font-bold mb-2">Ready to open your store?</h3>
        <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
          Apply for a merchant account in minutes. Basic plan is free — no
          credit card required.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/auth/apply-merchant"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Apply as Merchant <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/subscriptions/plans"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-white/60 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    </main>
  );
}
