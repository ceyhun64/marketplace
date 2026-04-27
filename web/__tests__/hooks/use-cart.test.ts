/**
 * hooks/use-cart.ts testleri
 *
 * Zustand store'u direkt test eder — React bileşeni renderlamaz.
 * Her test öncesi store sıfırlanır.
 */

import { renderHook, act } from "@testing-library/react";
import { useCart, type CartItem } from "@/hooks/use-cart";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeItem(
  overrides: Partial<CartItem> = {},
): Omit<CartItem, "quantity"> {
  return {
    offerId: "offer-1",
    productId: "prod-1",
    productName: "Test Ürünü",
    price: 100,
    merchantId: "merchant-1",
    stock: 10,
    ...overrides,
  };
}

beforeEach(() => {
  // Store'u her test öncesi temizle
  act(() => {
    useCart.getState().clearCart();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────────────────────────────────────

describe("addItem", () => {
  it("adds a new item with quantity 1", () => {
    act(() => {
      useCart.getState().addItem(makeItem());
    });

    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(1);
  });

  it("increments quantity when same offerId added twice", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
    });

    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("does not exceed stock limit when adding same item", () => {
    act(() => {
      // stock = 2, 3 kez eklemeye çalış
      useCart.getState().addItem(makeItem({ offerId: "offer-1", stock: 2 }));
      useCart.getState().addItem(makeItem({ offerId: "offer-1", stock: 2 }));
      useCart.getState().addItem(makeItem({ offerId: "offer-1", stock: 2 })); // bu eklenmemeli
    });

    const state = useCart.getState();
    expect(state.items[0].quantity).toBe(2);
  });

  it("adds different items as separate entries", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart
        .getState()
        .addItem(makeItem({ offerId: "offer-2", productId: "prod-2" }));
    });

    expect(useCart.getState().items).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeItem
// ─────────────────────────────────────────────────────────────────────────────

describe("removeItem", () => {
  it("removes item by offerId", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart
        .getState()
        .addItem(makeItem({ offerId: "offer-2", productId: "prod-2" }));
      useCart.getState().removeItem("offer-1");
    });

    const state = useCart.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].offerId).toBe("offer-2");
  });

  it("does not throw when removing non-existent offerId", () => {
    expect(() => {
      act(() => {
        useCart.getState().removeItem("non-existent");
      });
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateQuantity
// ─────────────────────────────────────────────────────────────────────────────

describe("updateQuantity", () => {
  it("updates quantity to specified value", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().updateQuantity("offer-1", 5);
    });

    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().updateQuantity("offer-1", 0);
    });

    expect(useCart.getState().items).toHaveLength(0);
  });

  it("removes item when quantity set to negative", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().updateQuantity("offer-1", -1);
    });

    expect(useCart.getState().items).toHaveLength(0);
  });

  it("caps quantity at stock limit", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1", stock: 3 }));
      useCart.getState().updateQuantity("offer-1", 100); // stok 3
    });

    expect(useCart.getState().items[0].quantity).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearCart
// ─────────────────────────────────────────────────────────────────────────────

describe("clearCart", () => {
  it("removes all items", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart
        .getState()
        .addItem(makeItem({ offerId: "offer-2", productId: "prod-2" }));
      useCart.getState().clearCart();
    });

    expect(useCart.getState().items).toHaveLength(0);
  });

  it("resets shippingRate to REGULAR", () => {
    act(() => {
      useCart.getState().setShippingRate("EXPRESS");
      useCart.getState().clearCart();
    });

    expect(useCart.getState().shippingRate).toBe("REGULAR");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Computed values
// ─────────────────────────────────────────────────────────────────────────────

describe("computed values", () => {
  it("totalItems counts sum of quantities", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().addItem(makeItem({ offerId: "offer-1" })); // qty = 2
      useCart
        .getState()
        .addItem(makeItem({ offerId: "offer-2", productId: "prod-2" })); // qty = 1
    });

    expect(useCart.getState().totalItems()).toBe(3);
  });

  it("subtotal = sum of price * quantity", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1", price: 100 }));
      useCart.getState().addItem(makeItem({ offerId: "offer-1", price: 100 })); // 2 × 100 = 200
      useCart
        .getState()
        .addItem(
          makeItem({ offerId: "offer-2", productId: "prod-2", price: 50 }),
        ); // 1 × 50 = 50
    });

    expect(useCart.getState().subtotal()).toBe(250);
  });

  it("shippingCost is 0 when cart is empty", () => {
    expect(useCart.getState().shippingCost()).toBe(0);
  });

  it("shippingCost is positive when cart has items", () => {
    act(() => {
      useCart.getState().addItem(makeItem());
    });
    expect(useCart.getState().shippingCost()).toBeGreaterThan(0);
  });

  it("EXPRESS shippingCost is higher than REGULAR", () => {
    act(() => {
      useCart.getState().addItem(makeItem());
    });

    act(() => {
      useCart.getState().setShippingRate("REGULAR");
    });
    const regularCost = useCart.getState().shippingCost();

    act(() => {
      useCart.getState().setShippingRate("EXPRESS");
    });
    const expressCost = useCart.getState().shippingCost();

    expect(expressCost).toBeGreaterThan(regularCost);
  });

  it("total = subtotal + shippingCost", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ price: 100 }));
    });

    const state = useCart.getState();
    expect(state.total()).toBe(state.subtotal() + state.shippingCost());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasItem / getItemQuantity
// ─────────────────────────────────────────────────────────────────────────────

describe("hasItem", () => {
  it("returns true for existing offerId", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
    });
    expect(useCart.getState().hasItem("offer-1")).toBe(true);
  });

  it("returns false for non-existing offerId", () => {
    expect(useCart.getState().hasItem("offer-999")).toBe(false);
  });
});

describe("getItemQuantity", () => {
  it("returns correct quantity for existing item", () => {
    act(() => {
      useCart.getState().addItem(makeItem({ offerId: "offer-1" }));
      useCart.getState().updateQuantity("offer-1", 4);
    });
    expect(useCart.getState().getItemQuantity("offer-1")).toBe(4);
  });

  it("returns 0 for non-existing item", () => {
    expect(useCart.getState().getItemQuantity("does-not-exist")).toBe(0);
  });
});
