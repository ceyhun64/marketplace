import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-white px-3.5 py-1 text-sm text-[var(--charcoal)] transition-all duration-[var(--dur-fast)] outline-none",
        "placeholder:text-[var(--charcoal-mist)]",
        "hover:border-[var(--border-mid)]",
        "focus-visible:border-[var(--red)] focus-visible:ring-3 focus-visible:ring-[var(--red)]/18 focus-visible:shadow-[var(--shadow-focus)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--charcoal)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--off-white-2)]",
        "aria-invalid:border-[var(--red)] aria-invalid:ring-3 aria-invalid:ring-[var(--red)]/18",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
