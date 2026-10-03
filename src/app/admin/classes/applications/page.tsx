"use client"

import { SectionHeader } from "@/components/reusable/section-header"
import { ClassApplicationsDashboard } from "@/components/ui/application/class-applications-dashboard"
import { GraduationCap, Sparkles, Lightbulb } from "lucide-react"

export default function TeacherApplicationsPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <SectionHeader
        title="Class Applications"
        description="Review and manage student applications for your classes with comprehensive document viewing and approval workflow"
        icon={GraduationCap}
      />
      <ClassApplicationsDashboard />
    </div>
  )
}
