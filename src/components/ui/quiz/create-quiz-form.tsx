"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Save, PlusCircle, FileText, ListChecks } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dev/alert-dialog";
import { Label } from "@/components/dev/label";
import { Input } from "@/components/dev/input";
import { Textarea } from "@/components/dev/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { Button } from "@/components/dev/button";

import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { QuestionEditor } from "./question-editor";
import { formatGradeName } from "@/lib/formatters";

import type { QuizFormData, Question } from "@/types/quiz";
import { getClasses } from "@/services/classService";
import { addQuestionsToQuiz, createQuiz, upsertQuiz } from "@/services/quizService";
import { useTaxonomy } from "@/context/CustomizationContext";

const createDefaultQuestion = (): Question => ({
  frontend_id: crypto.randomUUID(),
  id: Date.now(),
  type: "mcq",
  question: "",
  explanation: "",
  options: ["", ""],
  correctAnswer: 0,
});

interface CreateQuizFormProps {
  initialData?: QuizFormData;
  onSubmit: (data: QuizFormData) => Promise<void>;
  submitLabel?: string;
}

export function CreateQuizForm({
  initialData,
  onSubmit,
  submitLabel = "Create Quiz",
}: CreateQuizFormProps) {
  const isEditMode = !!initialData;

  const [quizData, setQuizData] = useState<QuizFormData>(
    initialData || {
      frontend_id: typeof crypto !== 'undefined' ? crypto.randomUUID() : undefined,
      title: "",
      subject: "",
      grade: "",
      description: "",
      class_id: "",
      difficulty: "Easy",
      time_limit_sec: 0,
      matchmaking_enabled: true,
      async_enabled: true,
      is_active: true,
      questions: [],
      correct_answer: "",
    }
  );

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const { subjects, grades } = useTaxonomy();

  const quizDataRef = useRef(quizData);
  useEffect(() => {
    quizDataRef.current = quizData;
  }, [quizData]);

  useEffect(() => {
    // 15 seconds auto save interval
    const interval = setInterval(async () => {
      try {
        const currentData = quizDataRef.current;
        // Basic validation: Don't autosave empty quiz
        if (!currentData.title && currentData.questions.length === 0) return;
        
        await upsertQuiz(currentData);
        console.log("Auto-saved quiz");
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // If you ever need to react to prop changes (rare in this case)
  useEffect(() => {
    if (initialData) {
      setQuizData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const classes = await getClasses();
        setAvailableClasses(classes);
      } catch (error) {
        console.error("Failed to load classes", error);
      }
    }

    fetchClasses();
  }, []);

  const handleQuizChange = useCallback(
    (field: keyof QuizFormData, value: any) => {
      setQuizData((prev) => {
        const updatedData = { ...prev, [field]: value };
        if (field === "subject") {
          updatedData.questions = updatedData.questions.map((q) => ({
            ...q,
            subject: value as "Math" | "Science",
          }));
        }
        return updatedData;
      });
    },
    []
  );

  const handleQuestionUpdate = useCallback(
    (index: number, updatedQuestion: Question) => {
      setQuizData((prev) => {
        const newQuestions = [...prev.questions];
        newQuestions[index] = updatedQuestion;
        return { ...prev, questions: newQuestions };
      });
    },
    []
  );

  const handleQuestionRemove = useCallback((index: number) => {
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }, []);

  const handleQuestionMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      const temp = newQuestions[index - 1];
      newQuestions[index - 1] = newQuestions[index];
      newQuestions[index] = temp;
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const handleQuestionMoveDown = useCallback((index: number) => {
    setQuizData((prev) => {
      if (index >= prev.questions.length - 1) return prev;
      const newQuestions = [...prev.questions];
      const temp = newQuestions[index + 1];
      newQuestions[index + 1] = newQuestions[index];
      newQuestions[index] = temp;
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const addQuestion = useCallback(() => {
    setQuizData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...createDefaultQuestion(),
          subject: prev.subject || "Math",
        },
      ],
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Both Create and Edit modes now use the same unified Upsert endpoint
      // for consistency with the auto-save mechanism.
      const response = await upsertQuiz(quizData);
      
      if (isEditMode) {
        // Optional: call parent onSubmit if needed for redirection/other logic,
        // though upsertQuiz already did the work.
        await onSubmit(quizData);
      } else {
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7">
        <SectionHeader
          title={isEditMode ? "Edit Quiz" : "Create New Quiz"}
          description={
            isEditMode
              ? "Modify questions, title, or structure of your existing quiz."
              : "Design engaging quizzes for your students."
          }
          icon={FileText}
        />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Info */}
          <CardSection
            title="Quiz Details"
            description="Provide general information about your quiz."
            icon={FileText}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  value={quizData.title}
                  onChange={(e) => handleQuizChange("title", e.target.value)}
                  placeholder="e.g., Advanced Algebra Quiz"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-subject">Subject</Label>
                  <Select
                    value={quizData.subject || undefined}
                    onValueChange={(value: any) =>
                      handleQuizChange("subject", value)
                    }
                    required
                  >
                    <SelectTrigger id="quiz-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter((s: any) => s.is_active !== false).map((s: any) => {
                        const val = s._id ? String(s._id) : s.name;
                        return (
                          <SelectItem key={val} value={val}>
                            {s.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-grade">Grade Level</Label>
                  <Select
                    value={quizData.grade || undefined}
                    onValueChange={(value: any) =>
                      handleQuizChange("grade", value)
                    }
                  >
                    <SelectTrigger id="quiz-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.filter((g: any) => g.is_active !== false).map((g: any) => {
                        const val = g._id ? String(g._id) : ((g.name || "").replace(/^grade\s*/i, "").trim() || g.name);
                        return (
                          <SelectItem key={val} value={val}>
                            {g.name.toLowerCase().startsWith("grade") ? g.name : `Grade ${g.name}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-class">Assign to Class</Label>
                <Select
                  value={quizData.class_id ?? "none"}
                  onValueChange={(value) =>
                    handleQuizChange(
                      "class_id",
                      value === "none" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger id="quiz-class">
                    <SelectValue placeholder="Select class or leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Unassigned)</SelectItem>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.title} — {formatGradeName(cls.grade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-description">Description</Label>
                <Textarea
                  id="quiz-description"
                  value={quizData.description}
                  onChange={(e) =>
                    handleQuizChange("description", e.target.value)
                  }
                  placeholder="A brief description of the quiz content."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-difficulty">Difficulty</Label>
                <Select
                  value={quizData.difficulty || undefined}
                  onValueChange={(value: "Easy" | "Medium" | "Hard") =>
                    handleQuizChange("difficulty", value)
                  }
                  required
                >
                  <SelectTrigger id="quiz-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-time-limit">Time Limit (seconds)</Label>
                <Input
                  id="quiz-time-limit"
                  type="number"
                  min={0}
                  value={quizData.time_limit_sec ?? 0}
                  onChange={(e) =>
                    handleQuizChange(
                      "time_limit_sec",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  placeholder="0 = No time limit"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!quizData.matchmaking_enabled}
                    onChange={(e) =>
                      handleQuizChange("matchmaking_enabled", e.target.checked)
                    }
                  />
                  <span>Enable Matchmaking</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!quizData.async_enabled}
                    onChange={(e) =>
                      handleQuizChange("async_enabled", e.target.checked)
                    }
                  />
                  <span>Enable Async Challenges</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!quizData.is_active}
                    onChange={(e) =>
                      handleQuizChange("is_active", e.target.checked)
                    }
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
          </CardSection>

          {/* Question Section */}
          <CardSection
            title="Questions"
            description="Add and configure individual questions for your quiz."
            icon={ListChecks}
          >
            <div className="space-y-6">
              {quizData.questions.map((question, index) => (
                <QuestionEditor
                  key={question.frontend_id || question._id || question.id || index}
                  question={question}
                  index={index}
                  totalQuestions={quizData.questions.length}
                  onMoveUp={handleQuestionMoveUp}
                  onMoveDown={handleQuestionMoveDown}
                  onUpdate={handleQuestionUpdate}
                  onRemove={handleQuestionRemove}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                className="w-full bg-transparent"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>
          </CardSection>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all font-semibold"
          >
            <Save className="w-5 h-5 mr-2" /> {submitLabel}
          </Button>
        </form>

      {/* Success Dialog (used only in create mode effectively) */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Quiz {isEditMode ? "Updated" : "Created"} Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your quiz "{quizData.title}" has been successfully{" "}
              {isEditMode ? "updated" : "created"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Got it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
