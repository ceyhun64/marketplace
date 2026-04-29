"use client";

import * as React from "react";
import PhoneInputPrimitive from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

// ─── Shadcn-uyumlu custom input ───────────────────────────────────────────────

const PhoneInputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full min-w-0 rounded-r-xl border border-l-0 border-border bg-background px-3.5 py-1 text-sm transition-all duration-150 outline-none",
      "placeholder:text-muted-foreground/60",
      "hover:border-border/80 hover:bg-accent/30",
      "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:bg-background",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
      "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
      className,
    )}
    {...props}
  />
));
PhoneInputField.displayName = "PhoneInputField";

// ─── Ana bileşen ───────────────────────────────────────────────────────────────

export interface PhoneInputProps {
  value?: Value | string;
  onChange: (value: Value | undefined) => void;
  defaultCountry?: React.ComponentProps<
    typeof PhoneInputPrimitive
  >["defaultCountry"];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "TR",
  className,
  disabled,
  placeholder,
}: PhoneInputProps) {
  return (
    <PhoneInputPrimitive
      inputComponent={PhoneInputField}
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      value={value as Value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={cn("phone-input-wrapper flex items-stretch", className)}
    />
  );
}

export default PhoneInput;

/*
  ─── globals.css'e ekle ───────────────────────────────────────────────────────

  @layer components {
    .phone-input-wrapper .PhoneInputCountry {
      @apply flex items-center gap-1.5 px-3 h-10
             rounded-l-xl border border-r-0 border-border
             bg-background transition-all duration-150 select-none
             relative;
    }

    .phone-input-wrapper .PhoneInputCountrySelect {
      @apply absolute inset-0 opacity-0 cursor-pointer w-full h-full;
    }

    .phone-input-wrapper .PhoneInputCountryIcon {
      @apply w-5 h-auto rounded-sm overflow-hidden shrink-0 pointer-events-none;
    }

    .phone-input-wrapper .PhoneInputCountrySelectArrow {
      @apply w-2.5 h-2.5 text-muted-foreground pointer-events-none;
    }
  }
*/
