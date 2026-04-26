import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]/40 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary — brand red */
        default:
          "bg-[var(--brand-red)] text-white shadow-[0_2px_6px_rgba(204,16,22,0.30)] hover:bg-[#A80D12] rounded-md",

        /* Secondary — charcoal outline */
        outline:
          "border-[var(--brand-charcoal)] text-[var(--brand-charcoal)] bg-transparent hover:bg-[var(--brand-charcoal)] hover:text-white rounded-md",

        /* Ghost — subtle */
        ghost:
          "text-[var(--brand-charcoal)] hover:bg-[var(--brand-offwhite)] rounded-md",

        /* Danger outline — red border */
        destructive:
          "border-[var(--brand-red)] text-[var(--brand-red)] bg-transparent hover:bg-[var(--brand-red)] hover:text-white rounded-md",

        /* Link */
        link: "text-[var(--brand-red)] underline-offset-4 hover:underline p-0 h-auto",

        /* Secondary (alias) */
        secondary:
          "bg-[var(--brand-offwhite)] text-[var(--brand-charcoal)] border-[var(--brand-border)] hover:bg-[var(--brand-border)] rounded-md",

        /* Brand (alias for default) */
        brand:
          "bg-[var(--brand-red)] text-white shadow-[0_2px_6px_rgba(204,16,22,0.30)] hover:bg-[#A80D12] rounded-md",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7  gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8  gap-1.5 px-3",
        lg: "h-11 gap-2 px-5 text-base",
        xl: "h-12 gap-2.5 px-6 text-base",
        icon: "size-10 rounded-md",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
