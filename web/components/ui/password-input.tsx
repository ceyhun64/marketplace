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
  (
    { className, value = "", onChange, onBlur, maskDelay = 800, ...props },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isLastCharVisible, setIsLastCharVisible] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Silme işlemi yapılıyorsa veya değer kısalıyorsa direkt maskele
      if (newValue.length <= value.length) {
        onChange?.(e);
        return;
      }

      // Yeni karakter eklendiğinde son karakteri göster
      onChange?.(e);

      if (!isVisible) {
        setIsLastCharVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () => setIsLastCharVisible(false),
          maskDelay,
        );
      }
    };

    const getDisplayText = () => {
      if (isVisible || value.length === 0) return value;
      if (isLastCharVisible) {
        return "•".repeat(value.length - 1) + value.slice(-1);
      }
      return "•".repeat(value.length);
    };

    return (
      <div className="relative w-full group">
        <input
          {...props}
          ref={ref}
          type="text"
          value={getDisplayText()}
          onChange={handleInputChange}
          onBlur={(e) => {
            setIsLastCharVisible(false);
            onBlur?.(e);
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
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
          onClick={() => {
            setIsVisible(!isVisible);
            setIsLastCharVisible(false);
          }}
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
