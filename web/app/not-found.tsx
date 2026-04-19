"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function NotFound() {
  const { user } = useAuth();

  const homeHref =
    user?.role === "Admin"
      ? "/admin"
      : user?.role === "Merchant"
        ? "/merchant"
        : user?.role === "Courier"
          ? "/courier"
          : "/";

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-4">
      {/* Big 404 */}
      <p className="text-[120px] font-black text-gray-100 leading-none select-none">
        404
      </p>

      <div className="text-center -mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 text-sm max-w-sm">
          The page you're looking for may have been moved, deleted, or never
          existed.
        </p>
      </div>

      <div className="flex gap-3 mt-8">
        <Link
          href={homeHref}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:border-gray-400 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
