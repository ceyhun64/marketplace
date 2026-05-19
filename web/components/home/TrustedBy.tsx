// Pure Server Component — no interactivity needed.
// CSS-only infinite marquee via @keyframes.

interface Brand {
  name: string;
  /** Optional: wide brands take more space visually */
  wide?: boolean;
}

interface TrustedByProps {
  brands?: Brand[];
  heading?: string;
}

const DEFAULT_BRANDS: Brand[] = [
  { name: "TechCorp", wide: true },
  { name: "Arché" },
  { name: "NovaTrade" },
  { name: "Steelhaus", wide: true },
  { name: "Lumino" },
  { name: "Qraft" },
  { name: "Velora", wide: true },
  { name: "Nordicco" },
  { name: "Prixco" },
  { name: "Goldleaf", wide: true },
  { name: "Axiom" },
  { name: "Castelo" },
];

export default function TrustedBy({
  brands = DEFAULT_BRANDS,
  heading = "Trusted by industry leaders",
}: TrustedByProps) {
  // Duplicate the list for seamless loop
  const track = [...brands, ...brands];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "#0C0C0F",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingBlock: "56px",
      }}
    >
      {/* Heading */}
      <p
        className="text-center text-xs font-semibold tracking-[0.18em] uppercase mb-10"
        style={{ color: "#3C3C44", fontFamily: "var(--font-body)" }}
      >
        {heading}
      </p>

      {/* Edge masks */}
      <div
        className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #0C0C0F, transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, #0C0C0F, transparent)",
        }}
      />

      {/* Marquee track */}
      <div className="overflow-hidden">
        <div
          className="flex items-center gap-14 marquee-track"
          style={{ width: "max-content" }}
        >
          {track.map((brand, i) => (
            <BrandLogo key={`${brand.name}-${i}`} name={brand.name} wide={brand.wide} />
          ))}
        </div>
      </div>

      {/* Keyframe injected inline so no global CSS file needed */}
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 34s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function BrandLogo({ name, wide }: { name: string; wide?: boolean }) {
  return (
    <span
      className="whitespace-nowrap font-semibold select-none tracking-tight transition-opacity duration-300 hover:opacity-70 cursor-default"
      style={{
        fontFamily: "var(--font-body)",
        fontSize: wide ? "1.0625rem" : "0.9375rem",
        letterSpacing: wide ? "-0.02em" : "-0.01em",
        color: "rgba(255,255,255,0.18)",
      }}
    >
      {name}
    </span>
  );
}
