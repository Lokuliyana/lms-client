"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getQuizSubmissionById } from "@/services/quizService";
import QuizReview from "../quizReview";

export default function QuizReviewPage() {
  const { submission } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<null | {
    quizTitle: string;
    subject: string;
    score: number;
    timeSpent: number;
    date: string;
    questions: any[];
  }>(null);

  useEffect(() => {
    if (!submission) return;

    const fetchSubmission = async () => {
      try {
        const res = await getQuizSubmissionById(submission.toString());
        setReviewData(res);
      } catch (err) {
        console.error("Failed to fetch quiz submission:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submission]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">Loading submission review...</span>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="p-6 text-center text-red-500">
        Submission not found or access denied.
      </div>
    );
  }

  return (
    <QuizReview
      questions={reviewData.questions}
      userAnswers={reviewData.questions.map((q) => q.userAnswer)}
      score={reviewData.score}
      maxScore={(reviewData as any).maxScore}
      percent={(reviewData as any).percent}
      timeSpent={reviewData.timeSpent}
    />
  );
}
