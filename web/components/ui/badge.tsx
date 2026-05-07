import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-pill)] font-mono text-xs font-medium tracking-[0.04em] border whitespace-nowrap transition-all duration-150 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--red-muted)] text-[var(--red)] border-[var(--red-subtle)]",
        secondary:
          "bg-[rgba(30,30,30,0.07)] text-[var(--charcoal)] border-[rgba(30,30,30,0.14)]",
        destructive:
          "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]",
        outline:
          "bg-transparent text-[var(--charcoal-mid)] border-[var(--border-mid)]",
        ghost:
          "bg-transparent text-[var(--charcoal-mid)] border-transparent hover:bg-[var(--off-white-2)]",
        link: "text-[var(--red)] underline-offset-4 hover:underline border-transparent",
        success:
          "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]",
        warning:
          "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]",
        info: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-border)]",
        dark: "bg-[var(--charcoal)] text-[var(--off-white)] border-[var(--charcoal)]",
        neutral:
          "bg-[rgba(30,30,30,0.07)] text-[var(--charcoal-mid)] border-[var(--border-light)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
