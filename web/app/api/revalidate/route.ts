import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

/**
 * POST /api/revalidate
 *
 * On-demand ISR cache invalidation endpoint.
 * Called by the .NET backend whenever a product, store, or category is updated.
 *
 * Security: protected by a shared secret (REVALIDATION_SECRET env var).
 * Never expose this endpoint without the secret check.
 *
 * Body:
 *   {
 *     secret: string,          // must match REVALIDATION_SECRET
 *     tags?: string[],         // cache tags to revalidate (e.g. ["product-uuid", "products"])
 *     paths?: string[],        // explicit paths to revalidate (e.g. ["/products"])
 *   }
 *
 * .NET call example (from ProductsController.Update):
 *   POST /api/revalidate
 *   { "secret": "...", "tags": ["product-{id}", "products"] }
 */
export async function POST(req: NextRequest) {
  let body: { secret?: string; tags?: string[]; paths?: string[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Revalidation secret is not configured on this server." },
      { status: 500 },
    );
  }

  if (body.secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Invalid revalidation secret." },
      { status: 401 },
    );
  }

  const revalidated: string[] = [];
  const errors: string[] = [];

  // ── Revalidate by cache tag ────────────────────────────────────────────────
  if (Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      try {
        // @ts-expect-error — revalidateTag type definitions vary across Next.js
        // canary / release versions; the runtime behaviour (1 string arg) is stable.
        revalidateTag(tag);
        revalidated.push(`tag:${tag}`);
      } catch (err) {
        errors.push(`tag:${tag} — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
  }

  // ── Revalidate by explicit path ────────────────────────────────────────────
  if (Array.isArray(body.paths)) {
    for (const path of body.paths) {
      try {
        revalidatePath(path);
        revalidated.push(`path:${path}`);
      } catch (err) {
        errors.push(`path:${path} — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
  }

  if (revalidated.length === 0 && errors.length === 0) {
    return NextResponse.json(
      { warning: "No tags or paths provided — nothing was revalidated." },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      revalidated,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: errors.length > 0 ? 207 : 200 },
  );
}

export const dynamic = "force-dynamic";
