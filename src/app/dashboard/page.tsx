// app/(dashboard)/student-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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

export default function StudentDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [isGuest, setIsGuest] = useState(true);
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const isStaff = user?.role === "teacher" || user?.role === "admin" || user?.role === "moderator";
      if (isStaff) {
        router.replace("/admin/dashboard");
        return;
      }

      setIsGuest(false);
      setDisplayName(
        user?.full_name ||
          user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
          undefined
      );
    } else {
      setIsGuest(true);
      setDisplayName(undefined);
    }

    async function fetchData() {
      try {
        const promises: Promise<any>[] = [
          getClasses(),
          getAllQuizzesForPlay(),
        ];
        
        if (user) {
          promises.push(getMyEnrolledClasses());
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

      <div className="space-y-8 sm:space-y-9">
        {/* Clay Hero Banner & Compact Stats for Logged-In Students */}
        {!isGuest && (
          <div className="space-y-4">
            <ClayHeroBanner
              title={`Welcome back, ${displayName || "Scholar"}! ✨`}
              description="Track your enrolled classes, scheduled live sessions, and interactive quizzes."
              badge="Student Portal"
              mascotSrc={CLAY_ASSETS.bannerStudentSaturn}
              cta={{
                label: "Browse Classes",
                href: "/classes",
              }}
              secondaryCta={{
                label: "Take Quiz",
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

        {/* Marketing Hero (Only for guest visitors on /dashboard) */}
        {isGuest && <HeroMarketing isGuest={isGuest} displayName={displayName} />}

        {/* Enrolled Classes (Only for students) */}
        {!isGuest && enrolledClasses.length > 0 && (
          <CardSection
            title={
              <EditableContent
                configKey="pages.dashboard.sections.enrolled.title"
                initialValue={pagesConfig.dashboard.sections.enrolled.title}
              />
            }
            description={
              <EditableContent
                configKey="pages.dashboard.sections.enrolled.description"
                initialValue={pagesConfig.dashboard.sections.enrolled.description}
              />
            }
            icon={pagesConfig.dashboard.sections.enrolled.icon}
            viewAllLabel={
              <EditableContent
                configKey="pages.dashboard.labels.viewAll"
                initialValue={pagesConfig.dashboard.labels.viewAll}
              />
            }
            onViewAll={() => router.push("/classes?view=enrolled")}
          >
            {loading ? (
              <SectionLoader />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledClasses.map((c: any) => (
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
                        initialValue={pagesConfig.dashboard.labels.viewClass}
                      />
                    }
                    isEnrolled={true}
                    hasAccessThisMonth={c.hasAccessThisMonth}
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
              initialValue={pagesConfig.dashboard.sections.popular.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.dashboard.sections.popular.description"
              initialValue={pagesConfig.dashboard.sections.popular.description}
            />
          }
          icon={pagesConfig.dashboard.sections.popular.icon}
          viewAllLabel={
            <EditableContent
              configKey="pages.dashboard.labels.exploreClasses"
              initialValue={pagesConfig.dashboard.labels.exploreClasses}
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
                      initialValue={pagesConfig.dashboard.labels.joinClass}
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
              initialValue={pagesConfig.dashboard.sections.quizzes.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.dashboard.sections.quizzes.description"
              initialValue={pagesConfig.dashboard.sections.quizzes.description}
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
          href="https://wa.me/+94706844133"
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
