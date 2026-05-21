"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInitiateCheckout, useConfirmPayment } from "@/queries/usePayment";
import { useCart } from "@/hooks/use-cart";
import type { ShippingRate, OrderSource } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  orderId: string;
  onSuccess?: (orderId: string) => void;
  className?: string;
}

// ── Inner Stripe form (Elements context içinde) ───────────────────────────────

function StripeCheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess?: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const { mutateAsync: confirmPayment } = useConfirmPayment();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // 1. Stripe Elements ile ödemeyi tamamla
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const result = await confirmPayment({
          orderId,
          paymentIntentId: paymentIntent.id,
        });

        clearCart();
        onSuccess?.(result.orderId);
        router.push(`/orders/${result.orderId}`);
      } catch {
        setErrorMessage(
          "Order confirmation failed. Your card has not been charged. Please contact our support team.",
        );
      }
    }

    setIsSubmitting(false);
  };

  return (
    /*
     * data-dd-privacy="mask" — DataDog RUM: masks this section from session replays.
     * data-hj-suppress      — Hotjar: suppresses screen recording of this form.
     * data-recording="off"  — LogRocket and similar tools respect this convention.
     *
     * These attributes ensure PII (card number, billing address) is NEVER captured
     * by any third-party session-recording tool, regardless of future integrations.
     */
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-dd-privacy="mask"
      data-hj-suppress=""
      data-recording="off"
    >
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {errorMessage && (
        <p className="text-sm text-destructive text-center" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Securely
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Secured by Stripe — 256-bit SSL encryption</span>
      </div>
    </form>
  );
}

// ── Ana bileşen — Stripe Elements sağlayıcısını kurar ────────────────────────

export function PaymentForm({
  orderId,
  onSuccess,
  className,
}: PaymentFormProps) {
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: initiateCheckout } = useInitiateCheckout();

  const initPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await initiateCheckout({ orderId });

      // Stripe publishable key ile yükle
      setStripePromise(loadStripe(result.publishableKey));
      setClientSecret(result.clientSecret);
    } catch (err) {
      setError("Payment could not be initialised. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId, initiateCheckout]);

  useEffect(() => {
    initPayment();
  }, [initPayment]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm text-destructive text-center">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={initPayment}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0f172a",
              borderRadius: "8px",
            },
          },
        }}
      >
        <StripeCheckoutForm orderId={orderId} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}

export default PaymentForm;
