import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, BookOpen } from "lucide-react";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100/60 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-36 h-36 mx-auto">
          <Image
            src={CLAY_ASSETS.emptyCatalogSearch}
            alt="Page not found"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            variant="primary"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-semibold h-10 px-5"
          >
            <Link href="/dashboard" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold h-10 px-4"
          >
            <Link href="/classes" className="flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Browse Classes</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
