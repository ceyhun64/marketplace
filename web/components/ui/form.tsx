"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Slot } from "radix-ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Form = react-hook-form FormProvider ───────────────────────────────────────
const Form = FormProvider;

// ── FormField context ─────────────────────────────────────────────────────────
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName };

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

// ── FormItem context ──────────────────────────────────────────────────────────
type FormItemContextValue = { id: string };

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

// ── useFormField ──────────────────────────────────────────────────────────────
function useFormField() {
  const fieldCtx = React.useContext(FormFieldContext);
  const itemCtx  = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldCtx.name) {
    throw new Error("useFormField must be used inside <FormField>");
  }

  const fieldState = getFieldState(fieldCtx.name, formState);
  const { id } = itemCtx;

  return {
    id,
    name:              fieldCtx.name,
    formItemId:        `${id}-item`,
    formDescriptionId: `${id}-description`,
    formMessageId:     `${id}-message`,
    ...fieldState,
  };
}

// ── FormItem ──────────────────────────────────────────────────────────────────
const FormItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const id = React.useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

// ── FormLabel ─────────────────────────────────────────────────────────────────
const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(error && "text-destructive", className)}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

// ── FormControl ───────────────────────────────────────────────────────────────
// Uses Radix Slot.Root to merge id + aria props into the single child element,
// so the child (Input, PasswordInput, etc.) receives the correct ids.
const FormControl = React.forwardRef<
  React.ComponentRef<typeof Slot.Root>,
  React.ComponentPropsWithoutRef<typeof Slot.Root>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot.Root
      ref={ref}
      id={formItemId}
      aria-describedby={
        error
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

// ── FormDescription ───────────────────────────────────────────────────────────
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

// ── FormMessage ───────────────────────────────────────────────────────────────
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};
