import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

/**
 * POST /api/auth/refresh
 *
 * Next.js Route Handler — backend refresh endpoint'ine proxy görevi görür.
 * SSR ortamında Axios interceptor'ın doğrudan backend'e ulaşamadığı durumlarda
 * (CORS, base URL sorunları) bu handler devreye girer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Token yenileme başarısız." },
      { status: 500 },
    );
  }
}
