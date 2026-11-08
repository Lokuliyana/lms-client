// app/(dashboard)/student-dashboard/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useEditMode } from "@/context/EditModeContext";
import { useCustomization } from "@/context/CustomizationContext";

import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import { ClassCard } from "@/components/reusable/classCard";
import QuizCard from "@/components/ui/quiz/quiz-card";
import HeroMarketing from "@/components/ui/hero-marketing";
import { getClasses, getMyEnrolledClasses } from "@/services/classService";
import { getAllQuizzesForPlay } from "@/services/quizService";
import Head from "next/head";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { siteConfig, pagesConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";
import { ClayHeroBanner } from "@/components/dashboard/ClayHeroBanner";
import { CompactStatCard } from "@/components/dashboard/CompactStatCard";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { NextLiveSessionCard } from "@/components/dashboard/NextLiveSessionCard";
import {
  GraduationCap,
  Globe,
  LayoutDashboard,
  Sparkles,
  Eye,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StudentDashboardContent() {
  const [classes, setClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { branding } = useBranding();
  const { isEditMode, toggleEditMode, setEditMode } = useEditMode();
  const { pagesSettings } = useCustomization();

  const whatsappRaw = branding?.supportWhatsApp || branding?.contactPhone || "";
  const cleanWa = whatsappRaw.replace(/[^0-9]/g, "");
  const waDashboardLink = `https://wa.me/${cleanWa.startsWith("0") ? "94" + cleanWa.slice(1) : cleanWa}`;

  const router = useRouter();
  const searchParams = useSearchParams();

  const isStaff =
    user?.role === "teacher" ||
    user?.role === "admin" ||
    user?.role === "moderator";

  const isTeacher = user?.role === "teacher";
  const viewParam = searchParams?.get("view");
  const staffView = viewParam === "guest" ? "guest" : "student";

  // Derive isGuest and displayName synchronously to prevent layout flashes
  const isGuest = !user || (isStaff && staffView === "guest");
  const displayName = user
    ? user.full_name ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      undefined
    : undefined;

  const [loading, setLoading] = useState(true);

  const switchPerspective = (targetView: "student" | "guest") => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("view", targetView);
    if (isEditMode) {
      params.set("edit", "true");
    } else {
      params.delete("edit");
    }
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (searchParams?.get("edit") === "true") {
      setEditMode(true);
    }
  }, [searchParams, setEditMode]);

  useEffect(() => {
    if (authLoading) return;

    async function fetchData() {
      try {
        const promises: Promise<any>[] = [
          getClasses(),
          getAllQuizzesForPlay(),
        ];
        
        if (user) {
          promises.push(
            getMyEnrolledClasses().catch((err) => {
              console.error("Failed to load enrolled classes:", err);
              return [];
            })
          );
        }

        const results = await Promise.all(promises);
        
        setClasses(results[0] || []);
        setQuizzes(results[1] || []);
        
        if (user && results[2]) {
          setEnrolledClasses(results[2] || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <SectionLoader />;
  }

  const activeDashboard = (pagesSettings?.dashboard || pagesConfig?.dashboard) as any;
  const studentHeroConfig = activeDashboard?.studentHero || {};
  const showEnrolled = !isGuest && (enrolledClasses.length > 0 || isStaff);
  const displayedEnrolled = enrolledClasses.length > 0 ? enrolledClasses : classes.slice(0, 3);

  return (
    <>
      <Head>
        <title>{pagesConfig.dashboard.metadata.title}</title>
        <meta name="description" content={pagesConfig.dashboard.metadata.description} />
        <meta name="keywords" content={pagesConfig.dashboard.metadata.keywords.join(", ")} />
        <link rel="canonical" href={pagesConfig.dashboard.metadata.url} />

        <meta property="og:title" content={pagesConfig.dashboard.metadata.title} />
        <meta property="og:description" content={pagesConfig.dashboard.metadata.description} />
        <meta property="og:url" content={pagesConfig.dashboard.metadata.url} />
        <meta property="og:site_name" content={siteConfig.layout.organization.name} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={pagesConfig.dashboard.metadata.ogImage} />
      </Head>

      <div className="space-y-6 sm:space-y-8">
        {/* Pleasant Small Toggle in Right Side Corner */}
        {isStaff && (
          <div className="w-full flex justify-end items-center gap-2 pb-0.5 animate-in fade-in duration-200">
            <div className="inline-flex items-center p-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full border border-slate-200/90 dark:border-slate-700 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => switchPerspective("student")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                  staffView === "student"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60"
                )}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => switchPerspective("guest")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                  staffView === "guest"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Guest</span>
              </button>
            </div>

            {/* Quick Live Edit Toggle */}
            <button
              type="button"
              onClick={toggleEditMode}
              title={isEditMode ? "Live Editing Active" : "Enable Live Edit Mode"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-2xs",
                isEditMode
                  ? "bg-amber-400 text-slate-950 border-amber-300 font-bold"
                  : "bg-white/95 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-950" />
                  <span className="hidden sm:inline">Editing</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Edit Mode</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Clay Hero Banner & Compact Stats for Logged-In Students */}
        {!isGuest && (
          <div className="space-y-4">
            <ClayHeroBanner
              title={
                <EditableContent
                  configKey="pages.dashboard.studentHero.title"
                  initialValue={
                    studentHeroConfig.title ||
                    `Welcome back, ${displayName || "Scholar"}! ✨`
                  }
                  as="span"
                />
              }
              description={
                <EditableContent
                  configKey="pages.dashboard.studentHero.description"
                  initialValue={
                    studentHeroConfig.description ||
                    "Track your enrolled classes, scheduled live sessions, and interactive quizzes."
                  }
                  as="span"
                />
              }
              badge={
                <EditableContent
                  configKey="pages.dashboard.studentHero.badge"
                  initialValue={studentHeroConfig.badge || "Student Portal"}
                  as="span"
                />
              }
              mascotConfigKey="pages.dashboard.studentHero.mascot"
              mascotSrc={studentHeroConfig.mascot || CLAY_ASSETS.bannerStudentSaturn}
              cta={{
                label: (
                  <EditableContent
                    configKey="pages.dashboard.studentHero.ctaLabel"
                    initialValue={studentHeroConfig.ctaLabel || "Browse Classes"}
                    as="span"
                  />
                ),
                href: "/classes",
              }}
              secondaryCta={{
                label: (
                  <EditableContent
                    configKey="pages.dashboard.studentHero.secondaryCtaLabel"
                    initialValue={studentHeroConfig.secondaryCtaLabel || "Take Quiz"}
                    as="span"
                  />
                ),
                href: "/quizzes",
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <CompactStatCard
                label="Enrolled Classes"
                value={enrolledClasses.length}
                status="emerald"
                href="/classes?view=enrolled"
              />
              <CompactStatCard
                label="Catalog Courses"
                value={classes.length > 0 ? classes.length : "Explore"}
                status="blue"
                href="/classes"
              />
              <CompactStatCard
                label="Available Quizzes"
                value={quizzes.length > 0 ? quizzes.length : "Ready"}
                status="purple"
                href="/quizzes"
              />
              <CompactStatCard
                label="My Deliveries"
                value="Track"
                status="amber"
                href="/dashboard/deliveries"
              />
            </div>
          </div>
        )}

        {/* Marketing Hero (Only for guest visitors or guest view on /dashboard) */}
        {isGuest && <HeroMarketing isGuest={isGuest} displayName={displayName} />}

        {/* Next Available Live Session UI (Before showing enrolled classes) */}
        {!isGuest && enrolledClasses.length > 0 && (
          <NextLiveSessionCard enrolledClasses={enrolledClasses} />
        )}

        {/* Enrolled Classes (Only for students or staff preview) */}
        {showEnrolled && (
          <CardSection
            title={
              <div className="flex items-center gap-2">
                <EditableContent
                  configKey="pages.dashboard.sections.enrolled.title"
                  initialValue={activeDashboard?.sections?.enrolled?.title || pagesConfig.dashboard.sections.enrolled.title}
                />
                {isStaff && enrolledClasses.length === 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/90 border border-amber-200/80 px-2 py-0.5 rounded-full">
                    Staff Preview
                  </span>
                )}
              </div>
            }
            description={
              <EditableContent
                configKey="pages.dashboard.sections.enrolled.description"
                initialValue={activeDashboard?.sections?.enrolled?.description || pagesConfig.dashboard.sections.enrolled.description}
              />
            }
            icon={pagesConfig.dashboard.sections.enrolled.icon}
            viewAllLabel={
              <EditableContent
                configKey="pages.dashboard.labels.viewAll"
                initialValue={activeDashboard?.labels?.viewAll || pagesConfig.dashboard.labels.viewAll}
              />
            }
            onViewAll={() => router.push("/classes?view=enrolled")}
          >
            {loading ? (
              <SectionLoader />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedEnrolled.map((c: any) => (
                  <ClassCard
                    key={c._id}
                    id={c._id}
                    classId={c.classId}
                    image={c.image || "/images/placeholder.jpg"}
                    title={c.title}
                    description={c.description}
                    labels={c.labels}
                    grade={c.grade}
                    subject={c.subject}
                    classTime={c.classTime}
                    classFee={c.classFee}
                    href={`/classes/${c._id}`}
                    ctaLabel={
                      <EditableContent
                        configKey="pages.dashboard.labels.viewClass"
                        initialValue={activeDashboard?.labels?.viewClass || pagesConfig.dashboard.labels.viewClass}
                      />
                    }
                    isEnrolled={true}
                    hasAccessThisMonth={c.hasAccessThisMonth ?? true}
                    teacher={c.teacher}
                  />
                ))}
              </div>
            )}
          </CardSection>
        )}

        {/* Classes */}
        <CardSection
          title={
            <EditableContent
              configKey="pages.dashboard.sections.popular.title"
              initialValue={activeDashboard?.sections?.popular?.title || pagesConfig.dashboard.sections.popular.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.dashboard.sections.popular.description"
              initialValue={activeDashboard?.sections?.popular?.description || pagesConfig.dashboard.sections.popular.description}
            />
          }
          icon={pagesConfig.dashboard.sections.popular.icon}
          viewAllLabel={
            <EditableContent
              configKey="pages.dashboard.labels.exploreClasses"
              initialValue={activeDashboard?.labels?.exploreClasses || pagesConfig.dashboard.labels.exploreClasses}
            />
          }
          onViewAll={() => router.push("/classes")}
        >
          {loading ? (
            <SectionLoader />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.slice(0, 3).map((c: any) => (
                <ClassCard
                  key={c._id}
                  id={c._id}
                  classId={c.classId}
                  image={c.image || "/images/placeholder.jpg"}
                  title={c.title}
                  description={c.description}
                  labels={c.labels}
                  grade={c.grade}
                  subject={c.subject}
                  classTime={c.classTime}
                  classFee={c.classFee}
                  href={`/classes/${c._id}`}
                  ctaLabel={
                    <EditableContent
                      configKey="pages.dashboard.labels.joinClass"
                      initialValue={activeDashboard?.labels?.joinClass || pagesConfig.dashboard.labels.joinClass}
                    />
                  }
                  isEnrolled={enrolledClasses.some(ec => ec._id === c._id)}
                  teacher={c.teacher}
                />
              ))}
            </div>
          )}
        </CardSection>

        {/* Quizzes */}
        <CardSection
          title={
            <EditableContent
              configKey="pages.dashboard.sections.quizzes.title"
              initialValue={activeDashboard?.sections?.quizzes?.title || pagesConfig.dashboard.sections.quizzes.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.dashboard.sections.quizzes.description"
              initialValue={activeDashboard?.sections?.quizzes?.description || pagesConfig.dashboard.sections.quizzes.description}
            />
          }
          icon={pagesConfig.dashboard.sections.quizzes.icon}
          onViewAll={() => router.push("/quizzes")}
        >
          {loading ? (
            <SectionLoader />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.slice(0, 3).map((quiz: any) => (
                <QuizCard key={quiz._id} quiz={quiz} />
              ))}
            </div>
          )}
        </CardSection>

        {/* WhatsApp bubble */}
        {/* WhatsApp bubble */}
        <motion.a
          href={waDashboardLink}
          aria-label="Chat on WhatsApp"
          className="
            fixed right-4
            bottom-24 md:bottom-8    /* higher on small screens */
            z-50
          "
          animate={{
            y: -8,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <motion.span
            className="
              flex items-center justify-center rounded-full
              h-11 w-11 md:h-12 md:w-12   /* smaller */
              bg-[#25D366]
              shadow-xl ring-1 ring-black/5
            "
            animate={{
              boxShadow: "0 4px 20px rgba(37, 211, 102, 0.6)",
            }}
            initial={{
              boxShadow: "0 0 0 0 rgba(37, 211, 102, 0)",
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {/* Official glyph inside, no outer square */}
            <FaWhatsapp className="h-7 w-7 md:h-8 md:w-8 text-white" />
          </motion.span>
        </motion.a>
      </div>
    </>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<SectionLoader />}>
      <StudentDashboardContent />
    </Suspense>
  );
}
