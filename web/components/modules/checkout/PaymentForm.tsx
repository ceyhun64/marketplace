"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCheckout } from "@/queries/usePayment";
import { useCart } from "@/hooks/use-cart";
import type { ShippingRate, OrderSource } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  merchantId: string;
  shippingAddress: ShippingAddress;
  shippingRate: ShippingRate;
  source: OrderSource;
  onSuccess?: (orderId: string) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PaymentForm({
  merchantId,
  shippingAddress,
  shippingRate,
  source,
  onSuccess,
  className,
}: PaymentFormProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { mutate: checkout, isPending, isError, error } = useCheckout();

  const iyzFormRef = useRef<HTMLDivElement>(null);
  const [formInjected, setFormInjected] = useState(false);

  /**
   * iyzico checkout form script'ini DOM'a inject eder.
   * checkoutFormContent bir <script> tag'i içerir;
   * innerHTML ile inject ettikten sonra script'lerin çalışması için
   * cloneNode trick'i kullanılır.
   */
  function injectIyzicoForm(htmlContent: string) {
    if (!iyzFormRef.current) return;
    iyzFormRef.current.innerHTML = htmlContent;

    // Script tag'leri innerHTML ile inject edilince çalışmaz —
    // her birini yeniden oluşturup DOM'a eklemek gerekir.
    const scripts = iyzFormRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value),
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    setFormInjected(true);
  }

  function handleCheckout() {
    checkout(
      {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress,
        shippingRate,
        source,
      },
      {
        onSuccess: (data) => {
          if (data.checkoutFormContent) {
            // iyzico popup / inline form
            injectIyzicoForm(data.checkoutFormContent);
          } else if (data.paymentPageUrl) {
            // Redirect to iyzico hosted page
            window.location.href = data.paymentPageUrl;
          }
        },
      },
    );
  }

  // İyzico 3DS callback'i window message ile dinle (popup mod)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        typeof event.data === "object" &&
        event.data?.status === "success" &&
        event.data?.orderId
      ) {
        clearCart();
        onSuccess?.(event.data.orderId);
        router.push(`/orders/${event.data.orderId}`);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [clearCart, onSuccess, router]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* İyzico form container — script inject edilince burada görünür */}
      <div ref={iyzFormRef} id="iyzipay-checkout-form" />

      {/* Ödeme başlat butonu — form inject edilmeden önce göster */}
      {!formInjected && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={isPending || items.length === 0}
          onClick={handleCheckout}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ödeme sayfası hazırlanıyor…
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Güvenli Öde
            </>
          )}
        </Button>
      )}

      {isError && (
        <p className="text-sm text-destructive text-center">
          Ödeme başlatılamadı. Lütfen tekrar deneyin.
          {error instanceof Error && (
            <span className="block text-xs opacity-70">{error.message}</span>
          )}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>256-bit SSL ile korunan güvenli ödeme (iyzico 3DS)</span>
      </div>
    </div>
  );
}

export default PaymentForm;
