/**
 * lib/auth.ts testleri
 *
 * Browser API'lerini (document.cookie, window, atob) jsdom ile test eder.
 * Cookie operasyonları, token parsing ve rol çıkarma doğrulanır.
 */

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
  parseToken,
  getRoleFromToken,
  type TokenPayload,
} from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verilen payload'ı Base64 ile kodlayarak sahte bir JWT oluşturur.
 * İmza doğrulaması bu testlerde yapılmaz; sadece yapı önemlidir.
 */
function buildFakeJwt(payload: object, expOffsetSeconds = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const fullPayload = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
      ...payload,
    }),
  );
  const signature = "fakesignature";
  return `${header}.${fullPayload}.${signature}`;
}

function buildExpiredJwt(): string {
  return buildFakeJwt({ sub: "user-id" }, -3600); // 1 saat önce expire olmuş
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie operations
// ─────────────────────────────────────────────────────────────────────────────

describe("setTokens / getAccessToken / getRefreshToken", () => {
  beforeEach(async () => {
    // clearTokens() uses the same deletion logic as the module itself
    await clearTokens();
  });

  it("stores and retrieves access token", () => {
    const token = buildFakeJwt({ sub: "user-1" });
    setTokens(token, "refresh-token");
    expect(getAccessToken()).toBe(token);
  });

  it("stores and retrieves refresh token", () => {
    setTokens("access-token", "my-refresh-token");
    expect(getRefreshToken()).toBe("my-refresh-token");
  });

  it("returns null when no token is set", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("overwrites existing token on re-set", () => {
    setTokens("first-token", "r1");
    setTokens("second-token", "r2");
    expect(getAccessToken()).toBe("second-token");
    expect(getRefreshToken()).toBe("r2");
  });
});

describe("clearTokens", () => {
  it("removes access and refresh tokens", () => {
    setTokens("some-access", "some-refresh");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isTokenExpired
// ─────────────────────────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  it("returns false for a valid (non-expired) token", () => {
    const token = buildFakeJwt({ sub: "user-1" }, 3600); // 1 saat sonra expire
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for an expired token", () => {
    const token = buildExpiredJwt();
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true for a malformed token", () => {
    expect(isTokenExpired("not.a.valid.jwt")).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isTokenExpired("")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseToken
// ─────────────────────────────────────────────────────────────────────────────

describe("parseToken", () => {
  it("parses valid JWT payload", () => {
    const payload = {
      sub: "user-123",
      email: "user@example.com",
      role: "Customer",
    };
    const token = buildFakeJwt(payload);
    const parsed = parseToken(token) as TokenPayload;

    expect(parsed).not.toBeNull();
    expect(parsed.sub).toBe("user-123");
    expect(parsed.email).toBe("user@example.com");
    expect(parsed.role).toBe("Customer");
  });

  it("returns null for malformed token", () => {
    expect(parseToken("not-a-jwt")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseToken("")).toBeNull();
  });

  it("parses merchantId claim", () => {
    const id = "merchant-guid-abc";
    const token = buildFakeJwt({ sub: "u1", merchantId: id });
    const parsed = parseToken(token);
    expect(parsed?.merchantId).toBe(id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRoleFromToken
// ─────────────────────────────────────────────────────────────────────────────

describe("getRoleFromToken", () => {
  it.each([
    ["Admin", "Admin"],
    ["Merchant", "Merchant"],
    ["Courier", "Courier"],
    ["Customer", "Customer"],
  ] as const)("extracts '%s' role from token", (role, expected) => {
    const token = buildFakeJwt({ sub: "u1", role });
    expect(getRoleFromToken(token)).toBe(expected);
  });

  it("extracts role from long .NET claim key", () => {
    const token = buildFakeJwt({
      sub: "u1",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin",
    });
    expect(getRoleFromToken(token)).toBe("Admin");
  });

  it("prefers short 'role' claim over long .NET claim", () => {
    // İkisi birden varsa kısa olanı tercih etmeli
    const token = buildFakeJwt({
      sub: "u1",
      role: "Merchant",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
        "Customer",
    });
    expect(getRoleFromToken(token)).toBe("Merchant");
  });

  it("returns null for token without role claim", () => {
    const token = buildFakeJwt({ sub: "u1", email: "user@example.com" });
    expect(getRoleFromToken(token)).toBeNull();
  });

  it("returns null for malformed token", () => {
    expect(getRoleFromToken("bad-token")).toBeNull();
  });
});
