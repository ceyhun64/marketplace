import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-[100px] rounded-[var(--radius-md)] border border-[var(--border-light)] bg-white px-3.5 py-2.5 text-sm text-[var(--charcoal)] transition-all duration-[var(--dur-fast)] outline-none resize-y",
        "placeholder:text-[var(--charcoal-mist)]",
        "hover:border-[var(--border-mid)]",
        "focus-visible:border-[var(--red)] focus-visible:ring-3 focus-visible:ring-[var(--red)]/18 focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--off-white-2)]",
        "aria-invalid:border-[var(--red)] aria-invalid:ring-3 aria-invalid:ring-[var(--red)]/18",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
