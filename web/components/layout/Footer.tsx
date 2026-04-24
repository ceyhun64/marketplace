"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = {
  marketplace: {
    title: "Discover",
    links: [
      { label: "All Categories", href: "/categories" },
      { label: "Featured Stores", href: "/stores" },
      { label: "Deals & Campaigns", href: "/deals" },
      { label: "New Arrivals", href: "/new" },
      { label: "Best Sellers", href: "/bestsellers" },
    ],
  },
  sellers: {
    title: "For Sellers",
    links: [
      { label: "Become a Seller", href: "/auth/register?role=merchant" },
      { label: "Merchant Dashboard", href: "/merchant" },
      { label: "Subscription Plans", href: "/subscriptions/plans" },
      { label: "Plugin Marketplace", href: "/plugins" },
      { label: "Seller Guide", href: "/seller-guide" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Order Tracking", href: "/track" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full flex flex-col items-center px-4 md:px-6 pb-12 mt-32">
      {/* Main Footer Container */}
      <div className="w-full max-w-[1200px] bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden p-8 md:p-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-8 group">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" fill="white" rx="1" />
                  <rect
                    x="9"
                    y="2"
                    width="5"
                    height="5"
                    fill="#e5e7eb"
                    rx="1"
                  />
                  <rect
                    x="2"
                    y="9"
                    width="5"
                    height="5"
                    fill="#e5e7eb"
                    rx="1"
                  />
                  <rect x="9" y="9" width="5" height="5" fill="white" rx="1" />
                </svg>
              </div>
              <span className="text-black text-xl font-bold tracking-tight">
                Marketplace
              </span>
            </Link>

            <p className="text-gray-500 text-[14px] leading-relaxed mb-8 max-w-[260px]">
              The modern meeting point of digital commerce. Discover with
              confidence, shop with pleasure.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2">
              {[
                { label: "Instagram", href: "#", icon: <InstagramIcon /> },
                { label: "Twitter", href: "#", icon: <TwitterIcon /> },
                { label: "LinkedIn", href: "#", icon: <LinkedInIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title} className="lg:ml-auto">
              <h3 className="text-[12px] uppercase tracking-wider text-black font-bold mb-8">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-500 text-[14px] font-medium hover:text-black transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-20 p-8 md:p-10 bg-gray-50/50 border border-gray-100 rounded-[24px]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h4 className="text-black text-xl mb-2 font-bold tracking-tight">
                Join Our Newsletter
              </h4>
              <p className="text-gray-500 text-[14px]">
                Get the latest stores and exclusive deals delivered to your
                inbox every week.
              </p>
            </div>
            <div className="flex items-center w-full lg:w-auto bg-white p-1.5 rounded-xl border border-gray-200 focus-within:border-black transition-all">
              <Input
                type="email"
                placeholder="Your email address"
                className="flex-1 lg:w-[280px] bg-transparent border-0 text-black placeholder:text-gray-400 focus-visible:ring-0 h-10 px-4"
              />
              <Button
                type="button"
                className="rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-xs px-6 h-10 transition-all active:scale-95"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-16 pt-10 border-t border-gray-50 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "2.4K+", label: "Active Sellers" },
            { value: "48K+", label: "Product Variety" },
            { value: "180K", label: "Happy Customers" },
            { value: "4.8/5", label: "Satisfaction Rate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="text-black text-lg font-bold mb-0.5">
                {stat.value}
              </div>
              <div className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="w-full max-w-[1100px] mt-10 px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[11px] text-gray-400 font-medium">
          © {currentYear} Marketplace Studio. All rights reserved.
        </p>
        <div className="flex items-center gap-8">
          {["Privacy", "Terms", "Cookies"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-[11px] text-gray-400 hover:text-black transition-colors font-medium"
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 opacity-40 hover:opacity-100 transition-opacity">
          {["VISA", "STRIPE", "IYZICO"].map((pay) => (
            <span
              key={pay}
              className="text-[9px] text-black font-bold border border-gray-200 px-2 py-1 rounded"
            >
              {pay}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// Icon Components remains the same
function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
