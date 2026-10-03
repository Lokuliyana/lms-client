"use client";

import { Brain, Sparkles } from "lucide-react";

export function CalculatingLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="relative">
        {/* Pulsing background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/20 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-400/20 rounded-full animate-pulse delay-75" />
        
        {/* Main Icon */}
        <div className="relative z-10 bg-white p-4 rounded-full shadow-xl border border-slate-100">
          <Brain className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>

        {/* Floating sparkles */}
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
        <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-pink-400 animate-bounce delay-150" />
      </div>

      <div className="mt-8 space-y-2 text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
          Calculating Results...
        </h3>
        <p className="text-slate-500 font-medium">
          Analyzing your answers
        </p>
      </div>
    </div>
  );
}
