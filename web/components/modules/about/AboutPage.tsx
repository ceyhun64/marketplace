"use client";

import Link from "next/link";
import {
  Users,
  Store,
  Package,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Heart,
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

const STATS = [
  { value: "50K+", label: "Active Buyers", icon: Users },
  { value: "1,200+", label: "Verified Sellers", icon: Store },
  { value: "180K+", label: "Listed Products", icon: Package },
  { value: "98.4%", label: "Satisfaction Rate", icon: Heart },
];

const VALUES = [
  {
    icon: Shield,
    title: "Trust First",
    desc: "Every seller is vetted. Every transaction is protected. We never compromise on security.",
  },
  {
    icon: Zap,
    title: "Speed & Simplicity",
    desc: "From discovery to doorstep — we are obsessed with removing friction at every single step.",
  },
  {
    icon: Globe,
    title: "Open to Everyone",
    desc: "Whether a small artisan or a large wholesaler — every seller deserves a professional storefront.",
  },
  {
    icon: TrendingUp,
    title: "Growth-Oriented",
    desc: "Our tools, analytics, and support are designed for sellers to thrive — not just survive.",
  },
];

const TIMELINE = [
  {
    year: "2021",
    title: "Foundation",
    desc: "Two developers and a whiteboard. The idea: a marketplace that actually works for sellers.",
  },
  {
    year: "2022",
    title: "First 100 Sellers",
    desc: "Reached our first milestone via bootstrapping. Word-of-mouth growth with zero marketing spend.",
  },
  {
    year: "2023",
    title: "Logistics Integration",
    desc: "Built our own fulfillment layer — real-time tracking, courier assignment, and label generation.",
  },
  {
    year: "2024",
    title: "Platform Launch",
    desc: "Public launch featuring subscription tiers, a plugin ecosystem, and an analytics dashboard.",
  },
  {
    year: "2025",
    title: "1,000+ Sellers",
    desc: "Passed our milestone. Expanded categories, introduced B2B tools, and opened our API.",
  },
  {
    year: "2026",
    title: "Today",
    desc: "50K+ buyers, 180K+ products, and a team of 30 people still operating like a startup.",
  },
];

const TEAM = [
  {
    name: "Alp Kaya",
    role: "Co-founder & CEO",
    bio: "10 years of experience in e-commerce infrastructure. Formerly: Trendyol, Amazon.",
    social: "#",
  },
  {
    name: "Deniz Yılmaz",
    role: "Co-founder & CTO",
    bio: "Passionate about scalable systems and distributed architecture. Ex-Google.",
    social: "#",
  },
  {
    name: "Selin Arslan",
    role: "Head of Product",
    bio: "User-centric product development. Formerly: Getir, Pazarama.",
    social: "#",
  },
  {
    name: "Mert Öztürk",
    role: "Head of Merchant Success",
    bio: "Focuses on seller growth. Experienced in onboarding thousands of merchants.",
    social: "#",
  },
];

const OPEN_ROLES = [
  {
    title: "Senior Backend Engineer",
    dept: "Engineering",
    type: "Full-Time",
    location: "Istanbul / Remote",
  },
  {
    title: "Product Designer",
    dept: "Design",
    type: "Full-Time",
    location: "Istanbul",
  },
  {
    title: "Merchant Success Manager",
    dept: "Operations",
    type: "Full-Time",
    location: "Istanbul / Hybrid",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,16,46,0.12) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-1 h-4" style={{ background: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              About Us
            </span>
          </div>
          <h1
            className="text-[48px] lg:text-[72px] leading-[1.05] text-white mb-6 max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Built for Sellers.{" "}
            <span style={{ color: "var(--red)" }}>Loved by Buyers.</span>
          </h1>
          <p
            className="text-lg max-w-xl leading-relaxed mb-10"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            We started as frustrated online buyers who couldn't find a
            marketplace that treated independent sellers fairly. So, we built
            one ourselves.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
              style={{
                background: "var(--red)",
                fontFamily: "var(--font-body)",
              }}
            >
              Become a Seller <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body)",
              }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        className="border-b"
        style={{
          background: "var(--off-white-2)",
          borderColor: "rgba(51,51,51,0.07)",
        }}
      >
        <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                style={{ background: "rgba(200,16,46,0.08)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
              </div>
              <div
                className="text-[2rem] font-bold leading-none mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--charcoal)",
                }}
              >
                {value}
              </div>
              <div
                className="text-sm"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-16 space-y-20">
        {/* Mission */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Mission
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight mb-5"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Democratizing Commerce
            </h2>
            <p
              className="text-base leading-relaxed mb-5"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              The internet promised a level playing field for small businesses.
              Instead, the reality has been dominated by gatekeepers demanding
              high fees, opaque algorithms, and providing zero support. We exist
              to change that.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              From a small maker selling home-baked goods to an emerging fashion
              brand, our platform equips every seller with professional,
              enterprise-grade tools at a fraction of the cost.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Zero listing fees — only pay when you sell",
              "Real-time analytics and inventory management",
              "Integrated logistics with live tracking",
              "Plugin ecosystem engineered for scaling",
              "Dedicated merchant success team",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--red)" }}
                />
                <span
                  className="text-[0.9375rem]"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Our Values
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              What We Stand For
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white"
                style={{
                  border: "1px solid rgba(51,51,51,0.07)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                  style={{ background: "rgba(200,16,46,0.07)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--red)" }} />
                </div>
                <h3
                  className="font-bold text-base mb-2"
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

        {/* Timeline */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Timeline
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Our Journey
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-[92px] top-0 bottom-0 w-px hidden lg:block"
              style={{ background: "rgba(51,51,51,0.1)" }}
            />
            <div className="space-y-8">
              {TIMELINE.map(({ year, title, desc }, i) => (
                <div key={year} className="flex gap-8 items-start">
                  <div className="flex-shrink-0 w-[72px] text-right">
                    <span
                      className="font-mono text-sm font-bold"
                      style={{
                        color:
                          i === TIMELINE.length - 1
                            ? "var(--red)"
                            : "var(--charcoal-mist)",
                      }}
                    >
                      {year}
                    </span>
                  </div>
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 hidden lg:block"
                    style={{
                      borderColor:
                        i === TIMELINE.length - 1
                          ? "var(--red)"
                          : "rgba(51,51,51,0.2)",
                      background:
                        i === TIMELINE.length - 1 ? "var(--red)" : "white",
                    }}
                  />
                  <div
                    className="flex-1 pb-8"
                    style={{
                      borderBottom:
                        i < TIMELINE.length - 1
                          ? "1px solid rgba(51,51,51,0.06)"
                          : "none",
                    }}
                  >
                    <h3
                      className="font-bold text-base mb-1"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Team
              </span>
            </div>
            <h2
              className="text-[36px] lg:text-[44px] leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              The People Behind It
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-2xl bg-white text-center"
                style={{
                  border: "1px solid rgba(51,51,51,0.07)",
                  boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "var(--off-white-2)" }}
                >
                  <Users
                    className="w-7 h-7"
                    style={{ color: "var(--charcoal-mist)" }}
                  />
                </div>
                <h3
                  className="font-bold text-sm mb-1"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-xs mb-3"
                  style={{
                    color: "var(--red)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {member.role}
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {member.bio || member.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Roles */}
        <section>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ background: "var(--red)" }} />
              <span
                className="font-mono text-[10px] uppercase tracking-[3px]"
                style={{ color: "var(--charcoal-mist)" }}
              >
                Careers
              </span>
            </div>
            <h2
              className="text-[28px] lg:text-[36px] leading-tight mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Open Positions
            </h2>
            <p
              className="text-sm"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Join our team of 30 people still operating with a startup mindset.
            </p>
          </div>
          <div className="space-y-3">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.title}
                className="flex items-center justify-between p-5 rounded-2xl"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--red-muted)" }}
                  >
                    <Briefcase
                      className="w-5 h-5"
                      style={{ color: "var(--red)" }}
                    />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-sm"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {role.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-xs"
                        style={{
                          color: "var(--charcoal-mist)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {role.dept}
                      </span>
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{
                          color: "var(--charcoal-mist)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        <MapPin className="w-3 h-3" /> {role.location}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--off-white-2)",
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Apply <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Press / Media */}
        <section
          className="rounded-2xl p-8"
          style={{
            background: "var(--white)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-1 h-4" style={{ background: "var(--red)" }} />
                <span
                  className="font-mono text-[10px] uppercase tracking-[3px]"
                  style={{ color: "var(--charcoal-mist)" }}
                >
                  Press & Media
                </span>
              </div>
              <h3
                className="text-[24px] text-charcoal mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--charcoal)",
                }}
              >
                Press Kit & Media Relations
              </h3>
              <p
                className="text-sm"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Contact us for logos, media assets, executive interviews, and
                official announcements.
              </p>
            </div>
            <a
              href="mailto:press@bazr.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "var(--charcoal)",
                color: "white",
                fontFamily: "var(--font-body)",
              }}
            >
              <Mail className="w-4 h-4" />
              press@bazr.com
            </a>
          </div>
        </section>

        {/* CTA */}
        <section
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--charcoal)" }}
        >
          <h2
            className="text-[36px] text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to Join Us?
          </h2>
          <p
            className="mb-8 max-w-md mx-auto text-sm"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            Whether you are a buyer looking for great deals or a seller ready to
            grow — there is a place for you here.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm"
              style={{
                background: "var(--red)",
                fontFamily: "var(--font-body)",
              }}
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body)",
              }}
            >
              Become a Seller
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
