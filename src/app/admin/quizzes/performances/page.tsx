"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { getAdminPerformance } from "@/services/quizService";
import PerformanceTracker from "@/components/ui/quiz/performance-tracker";

export default function AdminPerformancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const debouncedClassId = useDebounce(selectedClassId, 300);
  const debouncedSubject = useDebounce(selectedSubject, 300);
  const debouncedMonth = useDebounce(selectedMonth, 300);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await getAdminPerformance({
          classId: debouncedClassId,
          subject: debouncedSubject,
          month: debouncedMonth,
        });
        setData(res);
      } catch (err) {
        console.error("Admin performance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [debouncedClassId, debouncedSubject, debouncedMonth, user]);

  if (!user || authLoading) return null;

  return (
    <PerformanceTracker
      userRole={user.role}
      data={data}
      loading={loading}
      onFiltersChange={({ classId, subject, month }) => {
        setSelectedClassId(classId || "");
        setSelectedSubject(subject || "");
        setSelectedMonth(month || "");
      }}
    />
  );
}
