import Link from "next/link";
import {
  RotateCcw,
  PackageX,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

const RETURN_STEPS = [
  {
    number: "01",
    title: "Contact Us Within 14 Days",
    desc: "Submit a return request from your Orders page or contact our support team within 14 calendar days of receiving your order. Include your order number and reason for return.",
  },
  {
    number: "02",
    title: "Return Approval",
    desc: "Our team reviews your request within 1–2 business days. Once approved, you'll receive a prepaid shipping label by email (eligible orders only).",
  },
  {
    number: "03",
    title: "Ship the Item Back",
    desc: "Securely package the item in its original packaging where possible and drop it off at any authorised shipping point. Keep your tracking number.",
  },
  {
    number: "04",
    title: "Refund Processed",
    desc: "Once we receive and inspect the returned item (typically 2–3 business days), your refund is issued to the original payment method within 5–7 business days.",
  },
];

const ELIGIBLE = [
  "Item arrived damaged or defective",
  "Incorrect item received (wrong product or size)",
  "Item significantly different from the product description",
  "Item not received within 10 business days of dispatch",
];

const NOT_ELIGIBLE = [
  "Items returned after the 14-day window",
  "Items showing signs of use, wear, or damage caused by the customer",
  "Digital products, downloadable content, and gift cards",
  "Perishable goods and personalised / custom-made items",
  "Items without original packaging where packaging is required for hygiene",
];

const FAQ = [
  {
    q: "How long does a refund take?",
    a: "After your return is received and inspected (2–3 business days), your refund is processed within 5–7 business days to your original payment method. Bank processing times may add 1–3 additional days depending on your provider.",
  },
  {
    q: "Can I exchange an item instead of returning it?",
    a: "At this time we process returns as refunds only. To get a different item, place a new order after your refund is confirmed.",
  },
  {
    q: "What if my item arrived damaged?",
    a: "Please take photos of the damaged item and packaging immediately. Contact us within 14 days with the photos and your order number. Damaged items are eligible for a full refund or re-shipment at no cost to you.",
  },
  {
    q: "Who pays for return shipping?",
    a: "If the return is due to our error (damaged, defective, or wrong item), we provide a prepaid return shipping label. For change-of-mind returns, return shipping costs are the customer's responsibility.",
  },
  {
    q: "I ordered from an independent merchant store. Who handles my return?",
    a: "All returns are processed centrally through our platform regardless of which store you ordered from. Contact us and we'll coordinate with the merchant on your behalf.",
  },
];

export default function ReturnsPage() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
          Customer Support
        </span>
        <h1 className="text-4xl font-bold mb-4">Returns &amp; Refunds</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          We want you to be completely satisfied with every purchase. If
          something isn't right, we'll make it right — here's how our return and
          refund process works.
        </p>
      </div>

      {/* Return Window Banner */}
      <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 mb-12">
        <Clock className="w-8 h-8 text-blue-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-blue-900">14-Day Return Window</p>
          <p className="text-sm text-blue-700">
            You have 14 calendar days from the date of delivery to initiate a
            return.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6">How Returns Work</h2>
        <div className="space-y-4">
          {RETURN_STEPS.map((step) => (
            <div
              key={step.number}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                {step.number}
              </div>
              <div>
                <p className="font-semibold mb-1">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eligible / Not Eligible */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6">What Can Be Returned?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Eligible Returns</h3>
            </div>
            <ul className="space-y-2">
              {ELIGIBLE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-green-900"
                >
                  <span className="mt-0.5 text-green-500 font-bold text-xs">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PackageX className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-red-800">Not Eligible</h3>
            </div>
            <ul className="space-y-2">
              {NOT_ELIGIBLE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-red-900"
                >
                  <span className="mt-0.5 text-red-400 font-bold text-xs">
                    ✗
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Refund Info */}
      <section className="mb-14">
        <div className="rounded-2xl border border-border bg-card p-6 flex gap-4">
          <CreditCard className="w-7 h-7 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Refund Method &amp; Timing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All approved refunds are issued to the{" "}
              <strong className="text-foreground">
                original payment method
              </strong>{" "}
              used at checkout (credit/debit card via Stripe). You'll receive a
              confirmation email once the refund is initiated. Please allow 5–7
              business days for the refund to appear, plus any additional
              processing time from your bank or card issuer.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-border p-5 bg-card"
            >
              <div className="flex items-start gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="font-semibold text-sm">{item.q}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <div className="rounded-2xl bg-gray-900 text-white p-7 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
        <h3 className="text-lg font-bold mb-2">Need Help With a Return?</h3>
        <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
          Our support team is here to help. Reach out and we'll guide you
          through the process.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Contact Support
        </Link>
      </div>
    </main>
  );
}
