// components/auth/AccessDenied.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Home } from "lucide-react";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function AccessDenied({
  title = "You don’t have access",
  description = "This page is restricted. If you think this is a mistake, contact your administrator.",
  backHref = "/",
}: {
  title?: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-8 shadow-lg text-center flex flex-col items-center">
        {/* Clay 3D Access Denied Gate Illustration */}
        <div className="relative w-44 h-44 mb-4 drop-shadow-md">
          <Image
            src={CLAY_ASSETS.accessDeniedGate}
            alt="Access Denied"
            fill
            className="object-contain pointer-events-none select-none"
            priority
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Restricted Portal</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900">{title}</h1>

        <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
          >
            Sign In with Credentials
          </Link>
        </div>
      </div>
    </div>
  );
}
