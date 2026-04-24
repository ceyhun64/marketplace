"use client";

import { Search, CreditCard, MapPin, PackageCheck } from "lucide-react";

const STEPS = [
  {
    id: "01",
    title: "Find Product",
    description:
      "Search through thousands of items, browse categories, and find the best price.",
    icon: <Search className="w-6 h-6" />,
    accent: "bg-blue-500",
  },
  {
    id: "02",
    title: "Secure Payment",
    description:
      "Pay safely with 256-bit SSL encryption via credit card or bank transfer.",
    icon: <CreditCard className="w-6 h-6" />,
    accent: "bg-purple-500",
  },
  {
    id: "03",
    title: "Track Order",
    description:
      "Monitor your order in real-time. See your courier's live location on the map.",
    icon: <MapPin className="w-6 h-6" />,
    accent: "bg-emerald-500",
  },
  {
    id: "04",
    title: "Fast Delivery",
    description:
      "At your door within 24 hours. Get it today with our Express delivery option.",
    icon: <PackageCheck className="w-6 h-6" />,
    accent: "bg-orange-500",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-[11px] uppercase tracking-[4px] text-gray-400 font-bold">
              How it works
            </span>
          </div>
          <h2 className="text-black text-3xl lg:text-4xl font-bold tracking-tight">
            Shopping is this simple.
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className="group relative p-8 bg-white border border-gray-100 rounded-[24px] hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
            >
              {/* Icon & ID */}
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`w-12 h-12 ${step.accent} bg-opacity-10 rounded-xl flex items-center justify-center text-black`}
                >
                  {step.icon}
                </div>
                <span className="text-3xl font-black text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                  {step.id}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-black text-lg font-bold mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Bottom Progress Accent */}
              <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-transparent overflow-hidden">
                <div
                  className={`h-full w-0 group-hover:w-full transition-all duration-500 ${step.accent}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
