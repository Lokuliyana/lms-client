"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateQuizForm } from "@/components/ui/quiz/create-quiz-form";
import { getQuizByIdForUpdate } from "@/services/quizService";
import type { QuizFormData } from "@/types/quiz";
import { Skeleton } from "@/components/ui/skeleton";

type EditQuizPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const [initialData, setInitialData] = useState<QuizFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const quiz = await getQuizByIdForUpdate(quizId);

        setInitialData({
          frontend_id: quiz.frontend_id || quiz._id,
          title: quiz.title,
          description: quiz.instructions,
          subject: quiz.subject || "",
          class_id: quiz.class_id || "",
          difficulty: quiz.difficulty || "Easy",
          time_limit_sec: quiz.time_limit_sec ?? 0,
          matchmaking_enabled: quiz.matchmaking_enabled ?? true,
          async_enabled: quiz.async_enabled ?? true,
          is_active: quiz.is_active ?? true,
          questions: (quiz.questions || []).map((q: any) => ({
            id: q._id, // local ID for React
            _id: q._id,
            frontend_id: q.frontend_id || q._id,
            type: q.type,
            question: q.question,
            subject: quiz.subject || "Science",
            options: q.options ?? [],
            correctAnswer: q.correct_answer,
            explanation: q.explanation || "",
            marks: q.marks ?? 1,
            sliderRange: q.sliderRange,
            dragItems: q.dragItems,
            image: q.image ?? "",
          })),
          correct_answer: "", // Satisfy type definition
        });
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [quizId]);

  const handleUpdate = async (data: QuizFormData) => {
    // Note: CreateQuizForm already handles the actual upsertQuiz call internally.
    // This onSubmit is used for the final redirection and notification.
    alert("Quiz updated successfully!");
    router.push("/admin/quizzes");
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (!initialData) return <div className="p-8 text-slate-500 font-medium">Quiz not found.</div>;

  return (
    <CreateQuizForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Update Quiz"
    />
  );
}
