"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Users,
  Video,
  Award,
} from "lucide-react";

import { useCustomization } from "@/context/CustomizationContext";
import { useBranding } from "@/hooks/useBranding";

type Props = {
  isGuest: boolean;
  displayName?: string;
};

export default function HeroMarketing({ isGuest, displayName }: Props) {
  const { pagesSettings } = useCustomization();
  const { branding } = useBranding();
  const teacherName =
    branding.instructorName || pagesSettings?.about?.teacher?.name || "Danidu";

  const heroSubtitle =
    branding.slogan ||
    pagesSettings?.about?.hero?.subtitle ||
    "Empowering Minds Through Modern Education";
  const heroBullet1 =
    pagesSettings?.about?.hero?.bullet1 ||
    "Online වුණත් Physical වගේම උගන්වන ශ්‍රී ලංකාවේ ප්‍රමුඛතම විභාග කේන්ද්‍රීය පංතිය...";
  const heroHighlight1 =
    pagesSettings?.about?.hero?.highlight1 || "Sri Lanka’s very first STEM-based";
  const heroHighlight2 =
    pagesSettings?.about?.hero?.highlight2 || "Grade 06 to O/L classes.";
  const heroImage1 = pagesSettings?.about?.hero?.image1 || "/images/sw1.png";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative isolate overflow-hidden rounded-3xl border-2 border-indigo-200/60 bg-gradient-to-br from-violet-50/95 via-purple-50/70 to-indigo-100/90 p-6 md:p-8 lg:p-10 shadow-lg"
      style={{
        boxShadow: '0 16px 40px -8px rgba(99, 102, 241, 0.16), 0 4px 16px -2px rgba(168, 85, 247, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
      }}
    >
      {/* Subtle Purple & Blue Ambient Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/50 via-indigo-100/30 to-transparent" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-300/25 blur-3xl" />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* LEFT COLUMN: Clear Typography & Value Prop & Stats */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Credibility Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-white/90 px-3.5 py-1 text-xs font-semibold text-indigo-900 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {heroHighlight1} {heroHighlight2}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Master STEM & Exam Excellence with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {teacherName}
              </span>
            </h1>

            {/* Single Clear Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
              {heroSubtitle}
            </p>

            {/* Native Sinhala Mission Line */}
            <p className="text-sm md:text-[15px] text-slate-500 font-medium leading-relaxed max-w-2xl pt-1 border-l-2 border-indigo-200 pl-3 italic">
              {heroBullet1}
            </p>
          </div>

          {/* Social Proof / Verified Numbers Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 border-y border-slate-100 my-2">
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-lg sm:text-xl">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>1,250+</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Verified Students
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-lg sm:text-xl">
                <Award className="w-4 h-4 text-amber-500" />
                <span>98.6%</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                District Pass Rate
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-lg sm:text-xl">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>24/7</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                HD Replays & Notes
              </p>
            </div>
          </div>

          {/* Single Solid Primary Action Button & Secondary Outline */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isGuest ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 px-6 py-3 text-sm font-bold text-white shadow-md [box-shadow:0_8px_25px_rgba(99,102,241,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                >
                  <span>Join Class</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-indigo-200/90 bg-white/95 px-6 py-3 text-sm font-bold text-indigo-950 hover:bg-indigo-50/80 shadow-xs active:scale-95 transition-all"
                >
                  Browse Catalog
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 px-6 py-3 text-sm font-bold text-white shadow-md [box-shadow:0_8px_25px_rgba(99,102,241,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-sm font-medium text-slate-500">
                  Welcome back{displayName ? `, ${displayName}` : ""}.
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Bento Widgets (Next Session Widget + Single Instructor Portrait) */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* Bento Card 1: Next Upcoming Session Live Widget */}
          <div className="rounded-3xl border-2 border-indigo-200/80 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-md [box-shadow:0_12px_28px_-6px_rgba(99,102,241,0.18),inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Next Scheduled Session
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 px-3 py-1 rounded-full border border-indigo-200/70 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                In 2h 15m
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              Science & Mathematics • Theory Revision
            </h3>
            <p className="text-xs text-indigo-800 font-semibold mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Today at 6:30 PM – 8:30 PM (IST)</span>
            </p>

            {/* Checklist */}
            <div className="mt-3.5 pt-3 border-t border-indigo-100/90 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Session Materials Checklist
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Unit 4 Theory Workbook printed / open</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Scientific Calculator ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">Pre-flight Quick Assessment completed</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/classes"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-md [box-shadow:0_6px_20px_rgba(79,70,229,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
              >
                <span>Go to Virtual Classroom</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 2: Single Consistent Instructor Portrait */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200/80 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-md [box-shadow:0_10px_25px_-5px_rgba(99,102,241,0.14),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-indigo-200/80 shadow-xs bg-indigo-50">
              <Image
                src={heroImage1}
                alt={teacherName}
                fill
                sizes="96px"
                className="object-cover object-top"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/90 border border-indigo-200/80 px-2.5 py-0.5 rounded-full mb-1">
                Lead Educator
              </span>
              <h4 className="text-base font-extrabold text-slate-900 truncate">
                {teacherName}
              </h4>
              <p className="text-xs text-indigo-800 font-semibold">
                National Curriculum & Olympiad Coach
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-bold text-slate-800">10+ Years</span>{" "}
                Experience
                <span>•</span>
                <span className="font-medium text-slate-700">B.Sc. Eng (Hons)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
