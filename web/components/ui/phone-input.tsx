"use client";

import * as React from "react";
// Import getCountryCallingCode directly to avoid runtime errors
import PhoneInputPrimitive, {
  getCountryCallingCode,
} from "react-phone-number-input";
import type { Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── 1. Professional Country Selector (using Shadcn UI) ──────────────────────
const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: {
  disabled?: boolean;
  value?: string;
  onChange: (value?: string) => void;
  options: { value?: string; label: string }[];
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-center gap-1.5 self-stretch border border-r-0 border-border bg-background transition-all duration-150 outline-none",
            "rounded-l-xl px-3 hover:bg-accent/50 focus:z-10 focus:ring-3 focus:ring-primary/20 focus:border-primary",
            disabled && "pointer-events-none opacity-50 bg-muted",
          )}
        >
          {value && (
            <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20">
              <img
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${value}.svg`}
                alt={value}
                className="h-full w-full object-cover"
              />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <ScrollArea className="h-72">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options
                  .filter((x) => x.value)
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20">
                        <img
                          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${option.value}.svg`}
                          alt={option.label}
                        />
                      </span>
                      <span className="flex-1 text-sm">{option.label}</span>
                      {option.value && (
                        <span className="text-muted-foreground text-xs">
                          +{getCountryCallingCode(option.value as any)}
                        </span>
                      )}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ─── 2. Phone Input Field (Right Side) ───────────────────────────────────────
const PhoneInputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full min-w-0 rounded-r-xl border border-border bg-background px-3.5 py-1 text-sm transition-all duration-150 outline-none",
      "placeholder:text-muted-foreground/60",
      "hover:border-border/80 hover:bg-accent/30",
      "focus-visible:z-10 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20",
      "disabled:pointer-events-none disabled:opacity-50 disabled:bg-muted",
      className,
    )}
    {...props}
  />
));
PhoneInputField.displayName = "PhoneInputField";

// ─── 3. Main PhoneInput Component ───────────────────────────────────────────
export interface PhoneInputProps {
  value?: Value | string;
  onChange: (value: Value | undefined) => void;
  defaultCountry?: any;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "US",
  className,
  disabled,
  placeholder = "Enter phone number",
}: PhoneInputProps) {
  return (
    <div className={cn("flex items-stretch h-12", className)}>
      <PhoneInputPrimitive
        inputComponent={PhoneInputField}
        countrySelectComponent={CountrySelect as any}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value as Value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="flex flex-1"
      />
    </div>
  );
}

export default PhoneInput;
