// src/app/dashboard/sessions/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Video,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getClasses, getMyEnrolledClasses, createMeetingTicket } from "@/services/classService";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { ClassCard } from "@/components/reusable/classCard";
import { Button } from "@/components/ui/button";
import { CLAY_ASSETS, getSubjectPastelTheme } from "@/constants/clayAssets";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";

interface ClassSessionItem {
  _id: string;
  title: string;
  description?: string;
  grade?: string;
  subject?: string;
  image?: string;
  classTime?: Array<{ day: string; start?: string; startTime?: string; end?: string; endTime?: string }>;
  hasAccessThisMonth?: boolean;
  isEnrolled?: boolean;
}

export default function LiveSessionsPage() {
  const { user, isTeacher } = useAuth();
  const isAdmin = user?.role === "admin";
  const [enrolledClasses, setEnrolledClasses] = useState<ClassSessionItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"enrolled" | "all">("enrolled");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const promises: Promise<any>[] = [getClasses()];
        if (user) {
          promises.push(getMyEnrolledClasses());
        }
        const [catalogRes, enrolledRes] = await Promise.all(promises);

        setAllClasses(catalogRes || []);
        if (enrolledRes) {
          setEnrolledClasses(enrolledRes);
        }
      } catch (err) {
        console.error("Failed to load sessions data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const displayedClasses = activeTab === "enrolled" && user ? enrolledClasses : allClasses;

  const handleLaunchMeetingTicket = async (classId: string) => {
    try {
      setJoiningId(classId);
      setTicketError(null);
      const mode = isTeacher || isAdmin ? "start" : "join";
      const { redirect } = await createMeetingTicket(classId, mode);

      if (!redirect) {
        throw new Error("No ticket redirect URL returned by server.");
      }

      let finalUrl = redirect;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && (redirect.includes("zoom.us/j/") || redirect.includes("zoom.us/s/"))) {
        try {
          const urlObj = new URL(redirect);
          const meetingId = urlObj.pathname.split("/").pop();
          const pwd = urlObj.searchParams.get("pwd");
          const zak = urlObj.searchParams.get("zak");
          const action = redirect.includes("/s/") ? "start" : "join";
          if (meetingId) {
            finalUrl = `zoomus://zoom.us/${action}?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ""}${zak ? `&zak=${zak}` : ""}`;
          }
        } catch (e) {
          console.error("Deep link parsing failed", e);
        }
        window.location.href = finalUrl;
      } else {
        const opened = window.open(finalUrl, "_blank", "noopener,noreferrer");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          window.location.href = finalUrl;
        }
      }
    } catch (err: any) {
      console.error("Error creating meeting ticket:", err);
      setTicketError(err.response?.data?.message || err.message || "Failed to generate meeting ticket. Please try again.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Live Sessions & Tickets</span>
      </div>

      {/* Hero Section Header */}
      <SectionHeader
        title="Live Sessions & Meeting Tickets"
        description="Launch encrypted Zoom join tickets, view scheduled class timetables, and participate in real-time online lectures."
        icon={Video}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <Link href="/classes">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Browse Catalog
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {ticketError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{ticketError}</span>
          </div>
          <button
            type="button"
            onClick={() => setTicketError(null)}
            className="text-rose-600 hover:text-rose-800 font-semibold underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* View Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("enrolled")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "enrolled"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          My Enrolled Classes ({enrolledClasses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          All Scheduled Classes ({allClasses.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading session schedule & tickets...</p>
        </div>
      ) : displayedClasses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="relative w-36 h-36 mx-auto">
            <Image
              src={CLAY_ASSETS.emptyNoClassesToday}
              alt="No sessions found"
              fill
              className="object-contain"
            />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {activeTab === "enrolled" ? "No Enrolled Classes Found" : "No Scheduled Classes Available"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {activeTab === "enrolled"
                ? "You haven't enrolled in any classes yet. Browse our class catalog to discover subjects and obtain live Zoom access."
                : "No live classes are currently listed in the system directory."}
            </p>
          </div>
          <Button asChild variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs">
            <Link href="/classes">Explore Classes</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Ticket Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedClasses.map((item) => {
              const theme = getSubjectPastelTheme(item.subject);
              const isJoining = joiningId === item._id;
              const slots = item.classTime || [];

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header Pills */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
                        {formatSubjectName(item.subject)}
                      </span>
                      {item.grade && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatGradeName(item.grade)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Time Slots */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {slots.length > 0 ? (
                        slots.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700 capitalize">{s.day}:</span>
                            <span>
                              {s.startTime || s.start || "TBA"} - {s.endTime || s.end || "TBA"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Flexible Schedule / Online</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleLaunchMeetingTicket(item._id)}
                      disabled={isJoining}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-9"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Generating Ticket...
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 mr-1.5" />
                          Join Zoom Session
                        </>
                      )}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl h-9 px-3"
                    >
                      <Link href={`/classes/${item._id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Class Cards Grid via CardSection */}
          <CardSection
            title="Class Catalog View"
            description="Complete interactive class cards with monthly access status and course details."
            icon={Layers}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedClasses.map((c: any) => {
                const formattedTimes = (c.classTime || []).map((t: any) => ({
                  day: t.day,
                  start: t.startTime || t.start || "18:00",
                  end: t.endTime || t.end || "20:00",
                }));

                return (
                  <ClassCard
                    key={c._id}
                    id={c._id}
                    image={c.image || "/images/placeholder.jpg"}
                    title={c.title}
                    description={c.description}
                    labels={c.labels}
                    grade={c.grade}
                    subject={c.subject}
                    classTime={formattedTimes}
                    classFee={c.classFee}
                    href={`/classes/${c._id}`}
                    ctaLabel="View Details"
                    isEnrolled={Boolean(c.isEnrolled ?? activeTab === "enrolled")}
                    hasAccessThisMonth={c.hasAccessThisMonth ?? true}
                  />
                );
              })}
            </div>
          </CardSection>
        </div>
      )}
    </div>
  );
}
