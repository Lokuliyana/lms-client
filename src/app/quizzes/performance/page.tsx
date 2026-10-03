"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import {
  getStudentPerformance,
  getAdminPerformance,
  getTeacherPerformance,
} from "@/services/quizService";
import { getClasses } from "@/services/classService";
import PerformanceTracker from "@/components/ui/quiz/performance-tracker";
import type { QuizAttempt } from "@/types/quiz";

type ApiResponse = {
  total_attempts: number;
  average_score: string | number;
  submissions: Array<
    QuizAttempt & {
      totalQuestions?: number;
      maxScore?: number;
      score_pct?: number;
      correct_answers?: number;
    }
  >;
} | null;

export default function StudentPerformancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [data, setData] = useState<ApiResponse>(null);
  const [month, setMonth] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedMonth = useDebounce(month, 300);
  const debouncedClassId = useDebounce(selectedClassId, 300);
  const debouncedSubject = useDebounce(selectedSubject, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [mounted, authLoading, user, router]);

  useEffect(() => {
    if (user?.role && ["teacher", "admin", "moderator"].includes(user.role)) {
      getClasses().then((res) => {
        setClasses(res.map((c) => ({ id: c._id, name: c.title })));
      }).catch(err => console.error("Failed to fetch classes", err));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const isAdmin = user.role === "admin";
        const isTeacher = ["teacher", "moderator"].includes(user.role);

        if (isAdmin || isTeacher) {
          // Fetch admin/teacher aggregated data
          let res;
            if (isAdmin) {
              res = await getAdminPerformance({
                month: debouncedMonth || undefined,
                classId: debouncedClassId || undefined,
                subject: debouncedSubject || undefined,
              });
            } else {
              res = await getTeacherPerformance({
                month: debouncedMonth || undefined,
                classId: debouncedClassId || undefined,
                subject: debouncedSubject || undefined,
              });
            }

          // Admin/Teacher API returns array of attempts directly (or similar structure)
          // We need to adapt it to the format PerformanceTracker expects (array of QuizAttempt)
          setData({
            total_attempts: res?.length || 0,
            average_score: 0, // calculated by tracker
            submissions: res || [],
          });
        } else {
          // Fetch student personal data
          const res = await getStudentPerformance({
            userId: user._id,
            month: debouncedMonth || undefined,
          });

          const normalized: ApiResponse = res
            ? {
                total_attempts: Number(res.total_attempts || 0),
                average_score: res.average_score,
                submissions: Array.isArray(res.submissions)
                  ? res.submissions.map((s: any) => {
                      // Subject: treat "Unknown"/empty as "Math"
                      const rawSub = String(s.subject ?? "").trim();
                      const subject =
                        !rawSub || rawSub === "Unknown"
                          ? "Mathematics"
                          : rawSub;

                      // Time: convert seconds -> minutes for display
                      const timeSec = Number(
                        s.timeSpent ??
                          s.time_spent ??
                          s.time_spent_sec ??
                          s.time_sec ??
                          0
                      );
                      const timeSpent = Math.max(0, Math.round(timeSec / 60));

                      // Derive percent (0-100)
                      const pctFromApi = Number(
                        s.score_pct ?? s.percent ?? s.scorePercent ?? NaN
                      );

                      let percent: number | undefined = Number.isFinite(
                        pctFromApi
                      )
                        ? pctFromApi
                        : undefined;

                      if (percent === undefined) {
                        const rawScore = Number(
                          s.score ?? s.total_score ?? NaN
                        );
                        const maxScore = Number(
                          s.maxScore ?? s.max_score ?? NaN
                        );
                        const correct = Number(
                          s.correct_answers ?? s.correct ?? NaN
                        );
                        const totalQ = Number(
                          s.totalQuestions ?? s.total_questions ?? NaN
                        );

                        if (
                          Number.isFinite(rawScore) &&
                          Number.isFinite(maxScore) &&
                          maxScore > 0
                        ) {
                          percent = (rawScore / maxScore) * 100;
                        } else if (
                          Number.isFinite(correct) &&
                          Number.isFinite(totalQ) &&
                          totalQ > 0
                        ) {
                          percent = (correct / totalQ) * 100;
                        } else {
                          percent = 0; // fallback
                        }
                      }

                      // Clamp & round sensibly
                      const scorePercent = Math.max(
                        0,
                        Math.min(100, Math.round(percent))
                      );

                      return {
                        id: String(s.id ?? s._id ?? crypto.randomUUID()),
                        studentId: String(s.studentId ?? user._id),
                        studentName: String(
                          s.studentName ?? user.full_name ?? "Me"
                        ),
                        subject,
                        paperTitle: String(
                          s.paperTitle ?? s.quizTitle ?? s.title ?? "Untitled"
                        ),
                        // IMPORTANT: pass percent as score (0..100)
                        score: scorePercent,
                        // keep extras if present
                        totalQuestions:
                          Number(s.totalQuestions ?? s.total_questions ?? 0) ||
                          undefined,
                        maxScore:
                          Number(s.maxScore ?? s.max_score ?? 0) || undefined,
                        score_pct: scorePercent,
                        timeSpent, // minutes
                        date: new Date(
                          s.date ?? s.submitted_at ?? s.created_at ?? Date.now()
                        ),
                      } as QuizAttempt & {
                        totalQuestions?: number;
                        maxScore?: number;
                        score_pct?: number;
                      };
                    })
                  : [],
              }
            : null;

          setData(normalized);
        }
      } catch (err) {
        console.error("Performance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [user?._id, debouncedMonth, debouncedClassId, debouncedSubject]);

  if (!mounted || authLoading || !user) return null;

  return (
    <PerformanceTracker
      userRole={user.role}
      currentStudentId={user._id}
      data={data?.submissions || []}
      loading={loading}
      classes={classes}
      onFiltersChange={({ classId, subject, month }) => {
        setSelectedClassId(classId || "");
        setSelectedSubject(subject || "");
        setMonth(month || "");
      }}
    />
  );
}
