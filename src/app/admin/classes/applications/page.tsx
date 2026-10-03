"use client"

import { SectionHeader } from "@/components/reusable/section-header"
import { ClassApplicationsDashboard } from "@/components/ui/application/class-applications-dashboard"
import { GraduationCap, Sparkles, Lightbulb } from "lucide-react"

export default function TeacherApplicationsPage() {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-[15%] left-[8%] w-8 h-8 text-yellow-300 opacity-20 animate-pulse-slow" />
        <Lightbulb className="absolute bottom-[20%] right-[10%] w-10 h-10 text-purple-300 opacity-20 animate-pulse-slow delay-300" />
        <Sparkles className="absolute top-[25%] right-[6%] w-6 h-6 text-pink-300 opacity-15 animate-pulse-slow delay-200" />
        <Lightbulb className="absolute bottom-[10%] left-[8%] w-8 h-8 text-blue-400 opacity-15 animate-pulse-slow delay-500" />

        {/* Gradient Blobs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob-1" />
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-purple-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob-2" />
        <div className="absolute bottom-1/4 left-1/6 w-28 h-28 bg-yellow-200 rounded-full mix-blend-multiply blur-xl opacity-15 animate-blob-1" />
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply blur-xl opacity-15 animate-blob-2" />
      </div>

      {/* Content */}
      <div className="relative z-10 pb-20 pt-8 space-y-8">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Class Applications"
            description="Review and manage student applications for your classes with comprehensive document viewing and approval workflow"
            icon={GraduationCap}
          />
        </div>

        {/* Dashboard */}
        <ClassApplicationsDashboard />
      </div>
    </div>
  )
}
