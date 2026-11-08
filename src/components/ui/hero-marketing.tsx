"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  Video,
  Award,
  Sparkles,
  GraduationCap,
  Scale,
  BookOpen,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { useCustomization } from "@/context/CustomizationContext";
import { useBranding } from "@/hooks/useBranding";
import EditableContent from "@/components/admin/editable-content";
import EditableImage from "@/components/admin/editable-image";

type Props = {
  isGuest: boolean;
  displayName?: string;
};

export default function HeroMarketing({ isGuest, displayName }: Props) {
  const { pagesSettings } = useCustomization();
  const { branding } = useBranding();
  const guestHeroConfig = (pagesSettings?.dashboard as any)?.guestHero || {};
  const leadTeacher = (branding as any)?.leadTeacher;

  const teacherName =
    (guestHeroConfig.instructorName && guestHeroConfig.instructorName !== "NexvoLearn Instructor"
      ? guestHeroConfig.instructorName
      : null) ||
    leadTeacher?.full_name ||
    (branding.instructorName && branding.instructorName !== "NexvoLearn Instructor" && branding.instructorName !== "Danidu"
      ? branding.instructorName
      : null) ||
    (pagesSettings?.about?.teacher?.name && pagesSettings.about.teacher.name !== "NexvoLearn Instructor"
      ? pagesSettings.about.teacher.name
      : null) ||
    branding.instructorName ||
    "Lead STEM Educator";

  const heroSubtitle =
    guestHeroConfig.subtitle ||
    leadTeacher?.bio ||
    branding.slogan ||
    "Empowering Minds Through Conceptual Clarity, Scientific Logic & Exam Mastery";

  const heroBio =
    guestHeroConfig.bio ||
    leadTeacher?.bio ||
    "Dedicated STEM educator and scholar with over a decade of proven teaching excellence. Empowering Sri Lankan students from Grade 6 to O/L to conquer Mathematics and Science through deep conceptual clarity, rational logic, and structured exam strategies.";

  const heroBullet1 =
    guestHeroConfig.bullet1 ||
    "Online වුණත් Physical වගේම උගන්වන ශ්‍රී ලංකාවේ ප්‍රමුඛතම විභාග කේන්ද්‍රීය ගණිතය සහ විද්‍යාව පන්තිය...";

  const heroHighlight1 =
    pagesSettings?.about?.hero?.highlight1 || "Sri Lanka’s First STEM-based";
  const heroHighlight2 =
    pagesSettings?.about?.hero?.highlight2 || "Grade 06 to O/L classes.";

  const heroImage1 =
    guestHeroConfig.image ||
    leadTeacher?.avatar ||
    pagesSettings?.about?.teacher?.image ||
    branding.assets?.defaultAvatarUrl ||
    "/images/About.jpg";

  const qualParts = (leadTeacher?.qualifications || "")
    .split("•")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const firstQual = qualParts[0] || "";
  const secondQual = qualParts[1] || "";

  const heroDegree =
    guestHeroConfig.instructorDegree ||
    leadTeacher?.qualifications ||
    (branding as any).instructorDegree ||
    "Senior STEM Educator & Mentor";

  const heroRole =
    guestHeroConfig.instructorRole ||
    secondQual ||
    (branding as any).instructorRole ||
    "Academic Faculty Member";

  const heroExp =
    guestHeroConfig.instructorExp ||
    (branding as any).instructorExp ||
    "10+ Years Teaching Experience";

  const whatsappRaw =
    branding.supportWhatsApp ||
    branding.contactPhone ||
    "";
  const cleanWa = whatsappRaw.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${cleanWa.startsWith("0") ? "94" + cleanWa.slice(1) : cleanWa}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative isolate overflow-hidden rounded-3xl border-2 border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white/95 p-6 md:p-8 lg:p-10 shadow-xl"
      style={{
        boxShadow:
          "0 20px 45px -10px rgba(99, 102, 241, 0.18), 0 6px 18px -3px rgba(168, 85, 247, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.95)",
      }}
    >
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/40 via-indigo-100/25 to-transparent" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />

      {/* Grid: 7 cols Left, 5 cols Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* LEFT COLUMN: Teacher Personal Brand, Qualifications & Value Prop */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Top Credibility Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-white/95 px-3.5 py-1 text-xs font-semibold text-indigo-950 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <EditableContent
                configKey="pages.dashboard.guestHero.badge"
                initialValue={
                  guestHeroConfig.badge ||
                  `Official Website of ${teacherName} • Lead STEM Educator`
                }
                as="span"
              />
            </div>

            {/* Main Title Promoting Teacher & Platform */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              <EditableContent
                configKey="pages.dashboard.guestHero.title"
                initialValue={
                  guestHeroConfig.title ||
                  `Master Mathematics & Science with ${teacherName}`
                }
                as="span"
              />
            </h1>

            {/* Teacher Designation & Qualifications Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100/90 text-indigo-900 border border-indigo-200/80 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.instructorDegree"
                  initialValue={heroDegree}
                  as="span"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100/90 text-purple-900 border border-purple-200/80 shadow-2xs">
                <Scale className="w-3.5 h-3.5 text-purple-700" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.instructorRole"
                  initialValue={heroRole}
                  as="span"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.instructorExp"
                  initialValue={heroExp}
                  as="span"
                />
              </div>
            </div>

            {/* Single Clear Subtitle */}
            <EditableContent
              configKey="pages.dashboard.guestHero.subtitle"
              initialValue={heroSubtitle}
              className="text-base sm:text-lg text-slate-700 font-normal leading-relaxed max-w-2xl"
              as="p"
            />

            {/* Teacher Bio & Teaching Philosophy */}
            <EditableContent
              configKey="pages.dashboard.guestHero.bio"
              initialValue={heroBio}
              className="text-sm md:text-[15px] text-slate-600 font-normal leading-relaxed max-w-2xl"
              as="p"
            />

            {/* Native Sinhala Mission Line */}
            <EditableContent
              configKey="pages.dashboard.guestHero.bullet1"
              initialValue={heroBullet1}
              className="text-sm md:text-[15px] text-indigo-900 font-medium leading-relaxed max-w-2xl pt-1 border-l-3 border-indigo-400 pl-3.5 italic bg-indigo-50/50 py-1.5 rounded-r-xl"
              as="p"
            />
          </div>

          {/* Social Proof / Verified Numbers Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 border-y border-indigo-100/90 my-2">
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg sm:text-xl">
                <Users className="w-4 h-4 text-indigo-600" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.stats.students"
                  initialValue={guestHeroConfig.stats?.students || "1,250+"}
                  as="span"
                />
              </div>
              <EditableContent
                configKey="pages.dashboard.guestHero.stats.studentsLabel"
                initialValue={
                  guestHeroConfig.stats?.studentsLabel || "Verified Students"
                }
                className="text-xs text-slate-600 font-medium mt-0.5"
                as="p"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg sm:text-xl">
                <Award className="w-4 h-4 text-amber-500" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.stats.passRate"
                  initialValue={guestHeroConfig.stats?.passRate || "98.6%"}
                  as="span"
                />
              </div>
              <EditableContent
                configKey="pages.dashboard.guestHero.stats.passRateLabel"
                initialValue={
                  guestHeroConfig.stats?.passRateLabel || "District Pass Rate"
                }
                className="text-xs text-slate-600 font-medium mt-0.5"
                as="p"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg sm:text-xl">
                <Video className="w-4 h-4 text-emerald-600" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.stats.replays"
                  initialValue={guestHeroConfig.stats?.replays || "24/7"}
                  as="span"
                />
              </div>
              <EditableContent
                configKey="pages.dashboard.guestHero.stats.replaysLabel"
                initialValue={
                  guestHeroConfig.stats?.replaysLabel || "HD Replays & Notes"
                }
                className="text-xs text-slate-600 font-medium mt-0.5"
                as="p"
              />
            </div>
          </div>

          {/* Call to Actions & Direct Connect */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isGuest ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 px-6 py-3 text-sm font-bold text-white shadow-md [box-shadow:0_8px_25px_rgba(99,102,241,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                >
                  <EditableContent
                    configKey="pages.dashboard.guestHero.ctaJoinLabel"
                    initialValue={guestHeroConfig.ctaJoinLabel || "Join My Classes"}
                    as="span"
                  />
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-indigo-200/90 bg-white/95 px-6 py-3 text-sm font-bold text-indigo-950 hover:bg-indigo-50 shadow-xs active:scale-95 transition-all"
                >
                  <EditableContent
                    configKey="pages.dashboard.guestHero.ctaBrowseLabel"
                    initialValue={guestHeroConfig.ctaBrowseLabel || "Browse Catalog"}
                    as="span"
                  />
                </Link>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-3 text-sm font-bold shadow-2xs active:scale-95 transition-all"
                  title="Direct WhatsApp Inquiries"
                >
                  <FaWhatsapp className="w-4 h-4 text-emerald-600" />
                  <EditableContent
                    configKey="pages.dashboard.guestHero.ctaWaLabel"
                    initialValue={guestHeroConfig.ctaWaLabel || "Ask Teacher"}
                    as="span"
                  />
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 px-6 py-3 text-sm font-bold text-white shadow-md [box-shadow:0_8px_25px_rgba(99,102,241,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                >
                  <EditableContent
                    configKey="pages.dashboard.guestHero.ctaContinueLabel"
                    initialValue={guestHeroConfig.ctaContinueLabel || "Continue Learning"}
                    as="span"
                  />
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-sm font-medium text-slate-600">
                  Welcome back{displayName ? `, ${displayName}` : ""}.
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: The Teacher Showcase Spotlight Card */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-3xl border-2 border-indigo-200/80 bg-white/95 backdrop-blur-md shadow-lg [box-shadow:0_16px_36px_-6px_rgba(99,102,241,0.2),inset_0_1px_1px_rgba(255,255,255,1)] overflow-hidden flex flex-col">
            {/* Teacher High Quality Portrait Frame */}
            <div className="relative w-full h-80 sm:h-96 overflow-hidden bg-gradient-to-b from-indigo-100/60 to-purple-100/40">
              <EditableImage
                configKey="pages.dashboard.guestHero.image"
                initialValue={heroImage1}
                alt={teacherName}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover object-top hover:scale-105 transition-transform duration-500"
                priority
                aspectRatio={4 / 5}
              />

              {/* Floating Verified Badge */}
              <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-indigo-200/80 shadow-md text-xs font-bold text-indigo-950">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <EditableContent
                  configKey="pages.dashboard.guestHero.instructorBadge"
                  initialValue={
                    guestHeroConfig.instructorBadge || "Lead Educator & Founder"
                  }
                  as="span"
                />
              </div>

              {/* Overlaid Gradient at Bottom with Teacher Name */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-4 sm:p-5 text-white pointer-events-none">
                <div className="pointer-events-auto">
                  <EditableContent
                    configKey="pages.dashboard.guestHero.instructorName"
                    initialValue={teacherName}
                    className="text-xl sm:text-2xl font-black text-white drop-shadow-md tracking-tight"
                    as="h3"
                  />
                  <EditableContent
                    configKey="pages.dashboard.guestHero.instructorRoleBottom"
                    initialValue={
                      guestHeroConfig.instructorRoleBottom ||
                      guestHeroConfig.instructorRole ||
                      heroRole ||
                      secondQual ||
                      "Distinguished Academic Faculty"
                    }
                    className="text-xs font-semibold text-indigo-200 drop-shadow-xs mt-0.5"
                    as="p"
                  />
                </div>
              </div>
            </div>

            {/* Teacher Details & Next Session Ticker */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-600 border-b border-indigo-100 pb-3">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <EditableContent
                    configKey="pages.dashboard.guestHero.qualificationItem1"
                    initialValue={
                      guestHeroConfig.qualificationItem1 ||
                      firstQual ||
                      leadTeacher?.qualifications ||
                      "Conceptual STEM Mastery"
                    }
                    as="span"
                  />
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <EditableContent
                    configKey="pages.dashboard.guestHero.qualificationItem2"
                    initialValue={
                      guestHeroConfig.qualificationItem2 ||
                      secondQual ||
                      guestHeroConfig.instructorRole ||
                      heroRole ||
                      "Curriculum & Exam Specialist"
                    }
                    as="span"
                  />
                </span>
              </div>

              {/* Next Upcoming Live Session Info */}
              <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200/70 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Live Class Upcoming</span>
                  </div>
                  <EditableContent
                    configKey="pages.dashboard.guestHero.sessionWidget.title"
                    initialValue={
                      guestHeroConfig.sessionWidget?.title ||
                      "Science & Mathematics • Theory Revision"
                    }
                    className="text-xs font-bold text-slate-900 truncate mt-0.5"
                    as="p"
                  />
                  <p className="text-[11px] text-indigo-800 font-semibold mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <EditableContent
                      configKey="pages.dashboard.guestHero.sessionWidget.time"
                      initialValue={
                        guestHeroConfig.sessionWidget?.time ||
                        "Today at 6:30 PM (IST)"
                      }
                      as="span"
                    />
                  </p>
                </div>
                <Link
                  href="/classes"
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  <EditableContent
                    configKey="pages.dashboard.guestHero.sessionWidget.buttonLabel"
                    initialValue={
                      guestHeroConfig.sessionWidget?.buttonLabel ||
                      "Join"
                    }
                    as="span"
                  />
                </Link>
              </div>

              {/* Link to Full About Teacher Page */}
              <div className="pt-1 text-center">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <EditableContent
                    configKey="pages.dashboard.guestHero.aboutLinkLabel"
                    initialValue={
                      guestHeroConfig.aboutLinkLabel ||
                      "Read Teacher's Full Story & Credentials →"
                    }
                    as="span"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
