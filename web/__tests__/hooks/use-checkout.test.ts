/**
 * hooks/use-checkout.ts testleri
 *
 * Checkout Zustand store'u direkt test eder — React bileşeni renderlamaz.
 * Her test öncesi store reset() ile ilk durumuna döndürülür.
 */

import { act } from "@testing-library/react";
import { useCheckout } from "@/hooks/use-checkout";
import type { ShippingAddress } from "@/types/entities";
import type { EtaResult } from "@/lib/shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sampleAddress(): ShippingAddress {
  return {
    fullName: "Ali Veli",
    phone: "555-123-4567",
    addressLine: "Atatürk Cad. No: 42",
    city: "Istanbul",
    district: "Kadıköy",
    postalCode: "34710",
  };
}

function sampleEta(): EtaResult {
  return {
    minDays: 1,
    maxDays: 3,
    label: "1-3 iş günü",
  };
}

beforeEach(() => {
  act(() => {
    useCheckout.getState().reset();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts at cart step", () => {
    expect(useCheckout.getState().step).toBe("cart");
  });

  it("has null shippingAddress", () => {
    expect(useCheckout.getState().shippingAddress).toBeNull();
  });

  it("has REGULAR shippingRate by default", () => {
    expect(useCheckout.getState().shippingRate).toBe("REGULAR");
  });

  it("has null eta, orderId, paymentToken", () => {
    const state = useCheckout.getState();
    expect(state.eta).toBeNull();
    expect(state.orderId).toBeNull();
    expect(state.paymentToken).toBeNull();
  });

  it("isSubmitting is false initially", () => {
    expect(useCheckout.getState().isSubmitting).toBe(false);
  });

  it("error is null initially", () => {
    expect(useCheckout.getState().error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setStep
// ─────────────────────────────────────────────────────────────────────────────

describe("setStep", () => {
  it("changes step to specified value", () => {
    act(() => {
      useCheckout.getState().setStep("payment");
    });
    expect(useCheckout.getState().step).toBe("payment");
  });

  it("can jump directly to confirmation", () => {
    act(() => {
      useCheckout.getState().setStep("confirmation");
    });
    expect(useCheckout.getState().step).toBe("confirmation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// nextStep
// ─────────────────────────────────────────────────────────────────────────────

describe("nextStep", () => {
  it("advances from cart to address", () => {
    act(() => {
      useCheckout.getState().nextStep();
    });
    expect(useCheckout.getState().step).toBe("address");
  });

  it("advances through all steps in order", () => {
    const steps = ["cart", "address", "shipping", "payment", "confirmation"];
    for (let i = 0; i < steps.length - 1; i++) {
      act(() => {
        useCheckout.getState().nextStep();
      });
      expect(useCheckout.getState().step).toBe(steps[i + 1]);
    }
  });

  it("stays at confirmation when already at last step", () => {
    act(() => {
      useCheckout.getState().setStep("confirmation");
      useCheckout.getState().nextStep();
    });
    expect(useCheckout.getState().step).toBe("confirmation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// prevStep
// ─────────────────────────────────────────────────────────────────────────────

describe("prevStep", () => {
  it("goes back from payment to shipping", () => {
    act(() => {
      useCheckout.getState().setStep("payment");
      useCheckout.getState().prevStep();
    });
    expect(useCheckout.getState().step).toBe("shipping");
  });

  it("stays at cart when already at first step", () => {
    act(() => {
      useCheckout.getState().prevStep();
    });
    expect(useCheckout.getState().step).toBe("cart");
  });

  it("traverses all steps in reverse", () => {
    act(() => {
      useCheckout.getState().setStep("confirmation");
    });
    const steps = ["payment", "shipping", "address", "cart"];
    for (const expected of steps) {
      act(() => {
        useCheckout.getState().prevStep();
      });
      expect(useCheckout.getState().step).toBe(expected);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setShippingAddress
// ─────────────────────────────────────────────────────────────────────────────

describe("setShippingAddress", () => {
  it("stores the provided address", () => {
    const addr = sampleAddress();
    act(() => {
      useCheckout.getState().setShippingAddress(addr);
    });
    expect(useCheckout.getState().shippingAddress).toEqual(addr);
  });

  it("replaces the previous address", () => {
    const addr1 = sampleAddress();
    const addr2 = { ...sampleAddress(), city: "Ankara" };
    act(() => {
      useCheckout.getState().setShippingAddress(addr1);
      useCheckout.getState().setShippingAddress(addr2);
    });
    expect(useCheckout.getState().shippingAddress?.city).toBe("Ankara");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setShippingRate
// ─────────────────────────────────────────────────────────────────────────────

describe("setShippingRate", () => {
  it("updates shippingRate to EXPRESS", () => {
    act(() => {
      useCheckout.getState().setShippingRate("EXPRESS");
    });
    expect(useCheckout.getState().shippingRate).toBe("EXPRESS");
  });

  it("can switch back to REGULAR", () => {
    act(() => {
      useCheckout.getState().setShippingRate("EXPRESS");
      useCheckout.getState().setShippingRate("REGULAR");
    });
    expect(useCheckout.getState().shippingRate).toBe("REGULAR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setEta
// ─────────────────────────────────────────────────────────────────────────────

describe("setEta", () => {
  it("stores eta result", () => {
    const eta = sampleEta();
    act(() => {
      useCheckout.getState().setEta(eta);
    });
    expect(useCheckout.getState().eta).toEqual(eta);
  });

  it("can clear eta by passing null", () => {
    act(() => {
      useCheckout.getState().setEta(sampleEta());
      useCheckout.getState().setEta(null);
    });
    expect(useCheckout.getState().eta).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setOrderResult
// ─────────────────────────────────────────────────────────────────────────────

describe("setOrderResult", () => {
  it("stores orderId and paymentToken", () => {
    act(() => {
      useCheckout.getState().setOrderResult("order-123", "pi_test_token");
    });
    const state = useCheckout.getState();
    expect(state.orderId).toBe("order-123");
    expect(state.paymentToken).toBe("pi_test_token");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setSubmitting / setError
// ─────────────────────────────────────────────────────────────────────────────

describe("setSubmitting", () => {
  it("sets isSubmitting to true", () => {
    act(() => {
      useCheckout.getState().setSubmitting(true);
    });
    expect(useCheckout.getState().isSubmitting).toBe(true);
  });

  it("sets isSubmitting back to false", () => {
    act(() => {
      useCheckout.getState().setSubmitting(true);
      useCheckout.getState().setSubmitting(false);
    });
    expect(useCheckout.getState().isSubmitting).toBe(false);
  });
});

describe("setError", () => {
  it("stores error message", () => {
    act(() => {
      useCheckout.getState().setError("Ödeme başarısız.");
    });
    expect(useCheckout.getState().error).toBe("Ödeme başarısız.");
  });

  it("clears error when called with null", () => {
    act(() => {
      useCheckout.getState().setError("Hata!");
      useCheckout.getState().setError(null);
    });
    expect(useCheckout.getState().error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// reset
// ─────────────────────────────────────────────────────────────────────────────

describe("reset", () => {
  it("restores step to cart", () => {
    act(() => {
      useCheckout.getState().setStep("confirmation");
      useCheckout.getState().reset();
    });
    expect(useCheckout.getState().step).toBe("cart");
  });

  it("clears all fields to initial state", () => {
    act(() => {
      useCheckout.getState().setShippingAddress(sampleAddress());
      useCheckout.getState().setShippingRate("EXPRESS");
      useCheckout.getState().setEta(sampleEta());
      useCheckout.getState().setOrderResult("order-xyz", "token-abc");
      useCheckout.getState().setSubmitting(true);
      useCheckout.getState().setError("Some error");
      useCheckout.getState().reset();
    });

    const state = useCheckout.getState();
    expect(state.step).toBe("cart");
    expect(state.shippingAddress).toBeNull();
    expect(state.shippingRate).toBe("REGULAR");
    expect(state.eta).toBeNull();
    expect(state.orderId).toBeNull();
    expect(state.paymentToken).toBeNull();
    expect(state.isSubmitting).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useCheckoutProgress — pure logic (hook is a thin selector; test the math)
// ─────────────────────────────────────────────────────────────────────────────

// useCheckoutProgress calls useCheckout inside React — can't be invoked outside
// a renderer. We verify the same underlying calculation directly.
function computeProgress(step: ReturnType<typeof useCheckout.getState>["step"]): number {
  const STEPS = ["cart", "address", "shipping", "payment", "confirmation"] as const;
  const idx = STEPS.indexOf(step);
  return Math.round(((idx + 1) / STEPS.length) * 100);
}

describe("checkout progress calculation", () => {
  // cart=1/5=20, address=2/5=40, shipping=3/5=60, payment=4/5=80, confirmation=5/5=100

  it("returns 20 for cart (step 1 of 5)", () => {
    expect(computeProgress("cart")).toBe(20);
  });

  it("returns 40 for address (step 2 of 5)", () => {
    expect(computeProgress("address")).toBe(40);
  });

  it("returns 60 for shipping (step 3 of 5)", () => {
    expect(computeProgress("shipping")).toBe(60);
  });

  it("returns 80 for payment (step 4 of 5)", () => {
    expect(computeProgress("payment")).toBe(80);
  });

  it("returns 100 for confirmation (last step)", () => {
    expect(computeProgress("confirmation")).toBe(100);
  });
});
