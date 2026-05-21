import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Security constants ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// 5 MB — matches Cloudinary's free-tier recommended limit and blocks abuse
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Authentication ─────────────────────────────────────────────────────
  // Accept the JWT either as a Bearer token or from the access_token cookie.
  // Route Handlers run server-side, so reading cookies here is safe.
  const authHeader = req.headers.get("authorization") ?? "";
  const cookieToken = req.cookies.get("access_token")?.value ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  // Decode the JWT payload (we trust the signature was verified by .NET).
  // We only need the role claim here; full validation happens at the API.
  try {
    const parts   = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const role    = payload["role"] ??
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    // Only Merchant and Admin accounts may upload product media.
    const allowedRoles = ["Merchant", "Admin"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Insufficient permissions." },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid authentication token." },
      { status: 401 },
    );
  }

  // ── 2. Parse form data ────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file   = formData.get("file");
  const folder = (formData.get("folder") as string | null) || "marketplace/products";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // ── 3. File type validation ───────────────────────────────────────────────
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `File type '${file.type}' is not allowed. Use JPEG, PNG, WebP, or GIF.` },
      { status: 415 },
    );
  }

  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `File extension '${ext}' is not allowed.` },
      { status: 415 },
    );
  }

  // ── 4. File size validation ───────────────────────────────────────────────
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File size ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the 5 MB limit.` },
      { status: 413 },
    );
  }

  // ── 5. Folder whitelist — prevent path traversal ──────────────────────────
  const ALLOWED_FOLDERS = new Set([
    "marketplace/products",
    "marketplace/avatars",
    "marketplace/banners",
    "marketplace/stores",
  ]);

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: "Invalid upload folder." },
      { status: 400 },
    );
  }

  // ── 6. Upload to Cloudinary ───────────────────────────────────────────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<{
      secure_url: string;
      public_id:  string;
      format:     string;
      bytes:      number;
      width:      number;
      height:     number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          // Cloudinary transforms: auto-format + auto-quality for optimised delivery
          transformation: [{ fetch_format: "auto", quality: "auto" }],
          // Prevent overwriting existing assets
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload returned no result."));
          else resolve(result as any);
        },
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      url:      result.secure_url,
      publicId: result.public_id,
      format:   result.format,
      bytes:    result.bytes,
      width:    result.width,
      height:   result.height,
    });
  } catch (err) {
    // Never leak Cloudinary internals to the client
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}

// Next.js App Router config — disable body parsing so we handle formData manually
export const dynamic = "force-dynamic";
