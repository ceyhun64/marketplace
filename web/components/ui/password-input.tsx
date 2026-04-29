"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Prop tiplerini standart input gibi tutuyoruz
export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  value: string;
  maskDelay?: number;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, value, onChange, onBlur, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="relative w-full group">
        <input
          {...props}
          ref={ref}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete="current-password"
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 pr-10 text-sm transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
