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
      className="relative isolate overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-white via-[#FFFDFB] to-[#FFF9F2] p-6 md:p-8 lg:p-10 shadow-xs"
    >
      {/* Subtle Background Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-rose-50/20 to-transparent" />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* LEFT COLUMN: Clear Typography & Value Prop & Stats */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Credibility Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/90 px-3.5 py-1 text-xs font-semibold text-amber-800 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {heroHighlight1} {heroHighlight2}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Master STEM & Exam Excellence with{" "}
              <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-xs shadow-rose-500/20 active:scale-[0.98] transition-all"
                >
                  <span>Join Class</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Browse Catalog
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-xs shadow-rose-500/20 active:scale-[0.98] transition-all"
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
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Next Scheduled Session
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                In 2h 15m
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Science & Mathematics • Theory Revision
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Today at 6:30 PM – 8:30 PM (IST)</span>
            </p>

            {/* Checklist */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Session Materials Checklist
              </p>
              <div className="grid grid-cols-1 gap-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Unit 4 Theory Workbook printed / open</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Scientific Calculator ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pre-flight Quick Assessment completed</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/classes"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                <span>Go to Virtual Classroom</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 2: Single Consistent Instructor Portrait */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-4">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-slate-100">
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
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-1">
                Lead Educator
              </span>
              <h4 className="text-base font-bold text-slate-900 truncate">
                {teacherName}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                National Curriculum & Olympiad Coach
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-700">10+ Years</span>{" "}
                Experience
                <span>•</span>
                <span>B.Sc. Eng (Hons)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
