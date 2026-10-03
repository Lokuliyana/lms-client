"use client";

import { useRouter } from "next/navigation";
import { CreateQuizForm } from "@/components/ui/quiz/create-quiz-form";
import { createQuiz, addQuestionsToQuiz } from "@/services/quizService";
import type { QuizFormData } from "@/types/quiz";

export default function AddQuizPage() {
  const router = useRouter();

  const handleCreate = async (data: QuizFormData) => {
    const quiz = await createQuiz({
      title: data.title,
      instructions: data.description,
      class_id: data.class_id ?? "",
      subject: data.subject || undefined,
      difficulty: data.difficulty || "Easy",
      time_limit_sec: Number(data.time_limit_sec) || 0,
      question_count: Array.isArray(data.questions) ? data.questions.length : 0,
    });
    const quizId = quiz?.quiz?._id || (quiz as any)?._id;
    if (!quizId) throw new Error("Quiz ID not returned");

    await addQuestionsToQuiz(quizId, data.questions as any);
    router.push("/admin/quizzes");
  };

  return <CreateQuizForm onSubmit={handleCreate} submitLabel="Create Quiz" />;
}
