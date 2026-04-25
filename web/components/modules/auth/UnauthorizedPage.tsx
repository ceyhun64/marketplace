"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {/* Icon Section */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <LockKeyhole className="w-8 h-8 text-gray-600" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            You do not have permission to access this page. Please sign in to
            your account to continue.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            Sign In
          </button>

          <Link
            href="/"
            className="block w-full bg-white text-gray-700 py-3 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-gray-900 font-medium hover:underline"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
