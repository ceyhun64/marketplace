import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Star,
  Zap,
  Building2,
  ArrowRight,
} from "lucide-react";

const PLANS = [
  {
    key: "BASIC",
    label: "Basic",
    price: "Free",
    priceNote: "Forever",
    icon: Star,
    color: "text-gray-600",
    headerBg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    cta: "Get Started",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-700",
    features: [
      { label: "Independent E-Store (/store/slug)", ok: true },
      { label: "Up to 50 products", ok: true },
      { label: "Publish to Marketplace (general market)", ok: false },
      { label: "Custom subdomain (store.platform.com)", ok: false },
      { label: "Full custom domain (mystore.com)", ok: false },
      { label: "Plugin Marketplace access", ok: false },
      { label: "Analytics", ok: "Basic" },
      { label: "Logo / banner branding", ok: false },
      { label: "Priority support", ok: false },
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "$29",
    priceNote: "/ month",
    icon: Zap,
    color: "text-blue-600",
    headerBg: "bg-blue-50",
    border: "border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    highlight: true,
    cta: "Start Pro",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-500",
    features: [
      { label: "Independent E-Store (/store/slug)", ok: true },
      { label: "Unlimited products", ok: true },
      { label: "Publish to Marketplace (general market)", ok: true },
      { label: "Custom subdomain (store.platform.com)", ok: true },
      { label: "Full custom domain (mystore.com)", ok: false },
      { label: "Plugin Marketplace access", ok: true },
      { label: "Analytics", ok: "Full analytics" },
      { label: "Logo / banner branding", ok: true },
      { label: "Priority support", ok: false },
    ],
  },
  {
    key: "ENTERPRISE",
    label: "Enterprise",
    price: "Custom",
    priceNote: "Contact us",
    icon: Building2,
    color: "text-violet-600",
    headerBg: "bg-violet-50",
    border: "border-violet-400",
    badge: "bg-violet-100 text-violet-700",
    cta: "Contact Sales",
    ctaStyle: "bg-violet-600 text-white hover:bg-violet-500",
    features: [
      { label: "Independent E-Store (/store/slug)", ok: true },
      { label: "Unlimited products", ok: true },
      { label: "Publish to Marketplace (general market)", ok: true },
      { label: "Custom subdomain (store.platform.com)", ok: true },
      { label: "Full custom domain (mystore.com)", ok: true },
      { label: "Plugin Marketplace access", ok: true },
      { label: "Analytics", ok: "Custom reports" },
      { label: "Logo / banner branding", ok: true },
      { label: "Priority support", ok: true },
    ],
  },
];

const FAQ = [
  {
    q: "Does a plan upgrade take effect immediately?",
    a: "Yes, your plan change is applied immediately after payment is confirmed. You gain access to new features right away.",
  },
  {
    q: "What happens to my products if I downgrade?",
    a: "If you downgrade to Basic and you have more than 50 products, you won't be able to add new products until you're within the limit. Your existing products are not deleted.",
  },
  {
    q: "How does the Marketplace publishing feature work?",
    a: "On Pro and Enterprise plans, you can use the 'Publish to Marketplace' toggle on each product page to list your products on the public marketplace — reaching all platform shoppers.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel anytime from your Merchant Dashboard > Subscription. Your plan remains active until the end of the current billing period.",
  },
  {
    q: "What is a custom domain?",
    a: "Enterprise merchants can connect their own domain (e.g. mystore.com) to their e-store. Pro merchants get a custom subdomain (e.g. mystore.platform.com).",
  },
];

function FeatureValue({ ok }: { ok: boolean | string }) {
  if (ok === true)
    return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
  if (ok === false)
    return <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
  return (
    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
      {ok}
    </span>
  );
}

export default function SubscriptionPlansPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
          Merchant Plans
        </span>
        <h1 className="text-4xl font-bold mb-4">Choose Your Store Plan</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Start for free with your own branded e-store. Upgrade to unlock the
          public marketplace, custom domains, plugins, and advanced analytics.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 ${plan.border} bg-card flex flex-col overflow-hidden shadow-sm ${
                plan.highlight ? "md:-mt-3 md:mb-0 shadow-lg" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 inset-x-0 text-center py-1 bg-blue-600 text-white text-xs font-bold tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              <div
                className={`px-6 pt-${plan.highlight ? "8" : "6"} pb-5 ${plan.headerBg}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${plan.badge}`}
                  >
                    {plan.label}
                  </span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">
                    {plan.priceNote}
                  </span>
                </div>
              </div>

              <ul className="px-6 py-5 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    <FeatureValue ok={f.ok} />
                    <span
                      className={f.ok === false ? "text-muted-foreground" : ""}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="px-6 pb-6">
                <Link
                  href={
                    plan.key === "ENTERPRISE"
                      ? "/contact"
                      : "/auth/apply-merchant"
                  }
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Comparison Table */}
      <div className="mb-16">
        <h2 className="text-xl font-bold mb-6">Full Feature Comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Feature</th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className="text-center px-4 py-3 font-semibold"
                  >
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANS[0].features.map((f, i) => (
                <tr
                  key={f.label}
                  className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="px-5 py-3 text-muted-foreground">{f.label}</td>
                  {PLANS.map((p) => (
                    <td key={p.key} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <FeatureValue ok={p.features[i].ok} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-border p-5 bg-card"
            >
              <p className="font-semibold mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Already a merchant?{" "}
          <Link
            href="/merchant/subscription"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Manage your current plan →
          </Link>
        </p>
      </div>
    </main>
  );
}
