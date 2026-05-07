import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--red)]/40 focus-visible:outline-none active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary — brand red */
        default:
          "bg-[var(--red)] text-white border-transparent shadow-[0_2px_8px_rgba(200,16,46,0.20)] hover:bg-[var(--red-dark)] hover:shadow-[var(--shadow-red)] hover:-translate-y-px",

        /* Secondary — charcoal outline */
        outline:
          "border-[var(--border-mid)] text-[var(--charcoal)] bg-transparent hover:border-[var(--charcoal)] hover:bg-[var(--off-white-2)] hover:-translate-y-px",

        /* Ghost — subtle red tint */
        ghost:
          "border-[var(--red-subtle)] text-[var(--red)] bg-transparent hover:bg-[var(--red-muted)] hover:border-[var(--red)]",

        /* Danger — red border fills on hover */
        destructive:
          "border-[var(--red)] text-[var(--red)] bg-transparent hover:bg-[var(--red)] hover:text-white hover:-translate-y-px",

        /* Dark — charcoal filled */
        secondary:
          "bg-[var(--charcoal)] text-white border-transparent shadow-[var(--shadow-sm)] hover:bg-[#111] hover:shadow-[var(--shadow-md)] hover:-translate-y-px",

        /* Link */
        link: "text-[var(--red)] underline-offset-4 hover:underline p-0 h-auto border-transparent",

        /* Brand (alias for default) */
        brand:
          "bg-[var(--red)] text-white border-transparent shadow-[0_2px_8px_rgba(200,16,46,0.20)] hover:bg-[var(--red-dark)] hover:shadow-[var(--shadow-red)] hover:-translate-y-px",
      },
      size: {
        default: "h-10 gap-2 px-5 text-sm rounded-[var(--radius-md)]",
        xs: "h-7 gap-1 px-2.5 text-xs rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-sm rounded-[var(--radius-md)]",
        lg: "h-11 gap-2 px-6 text-base rounded-[var(--radius-md)]",
        xl: "h-12 gap-2.5 px-7 text-base rounded-[var(--radius-md)]",
        icon: "size-10 rounded-[var(--radius-md)]",
        "icon-xs":
          "size-7 rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[var(--radius-md)]",
        "icon-lg": "size-11 rounded-[var(--radius-md)]",
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
