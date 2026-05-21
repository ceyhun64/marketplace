import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Liveness probe for the Next.js container.
 * Used by docker-compose.prod.yml healthcheck and load-balancer probes.
 *
 * Returns 200 as long as the Node.js process is running.
 * For a deeper readiness check (API reachable?), use /api/health/ready.
 */
export async function GET() {
  return NextResponse.json(
    { status: "alive", timestamp: new Date().toISOString() },
    { status: 200 },
  );
}

export const dynamic = "force-dynamic";
