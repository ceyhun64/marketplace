/// <reference types="@testing-library/jest-dom" />
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// jsdom does not ship with a fetch implementation; provide a no-op stub so
// tests that call auth helpers (setTokens/clearTokens) don't crash on the
// fire-and-forget cookie-sync request.
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
}
