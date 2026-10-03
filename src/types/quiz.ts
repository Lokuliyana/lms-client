// types/quiz.ts

// ==============================
// Question primitives
// ==============================

export type QuestionType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "multiple-select"
  | "slider"
  | "drag-drop";

// A single question used inside form + metadata
export type Question = {
  id?: number | string;       // local UI id
  _id?: string;               // db id (when fetched)
  frontend_id?: string;       // stable uuid for React keys & upserts
  type: QuestionType;
  question: string;
  image?: string | null;
  explanation?: string;
  formula?: string;
  subject?: string;           // keep in sync with quiz subject if you propagate it
  options?: string[];         // for MCQ / multiple-select
  marks?: number;             // UI-optional, backend defaults/validates

  // flexibility for existing code paths
  correct_answer?: string | number | boolean | (string | number)[];
  correctAnswer?: string | number | boolean | (string | number)[];

  sliderRange?: {
    min: number;
    max: number;
    step: number;
  };

  dragItems?: {
    items: string[];
    matches: string[];
  };
};

// Shape returned for PLAY (safe: no correct answers/explanations)
export type SafeQuestion = {
  _id: string;
  quiz_id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  image?: string | null;
  marks: number;
  sliderRange?: { min: number; max: number; step: number };
  dragItems?: { items: string[]; matches: string[] };
};

// ==============================
// Quiz forms & metadata
// ==============================

export interface QuizFormData {
  frontend_id?: string;                // stable tracking id
  title: string;
  subject: string;                     // broaden beyond "Math" | "Science"
  grade?: string;                      // taxonomy Grade binding
  description: string;                 // maps to backend `instructions`
  class_id?: string;                   // undefined = public quiz

  // config
  difficulty: "Easy" | "Medium" | "Hard";
  time_limit_sec: number;              // 0 = no limit
  matchmaking_enabled: boolean;        // enable 1v1 matchmaking
  async_enabled: boolean;              // enable async challenges
  is_active: boolean;                  // toggle visibility
  question_count?: number;             // convenience (can derive from questions.length)
  version?: number;                    // question pool version (optional)

  questions: Question[];

  explanation?: string;
  options?: string[];
  correct_answer: string | number | boolean | (string | number)[];

  image?: string;
  formula?: string;
  meta?: Record<string, unknown>;

}

export interface QuizMetadata {
  id: string;                          // client convenience id (maps from _id)
  _id?: string;                        // raw mongo id (if present)
  title: string;
  description: string;                 // backend instructions
  subject?: string;                    // <-- optional to match backend (fixes TS error)

  difficulty: "Easy" | "Medium" | "Hard";
  class_id?: string;
  is_active: boolean;

  time_limit_sec: number;
  matchmaking_enabled: boolean;
  async_enabled: boolean;

  question_count?: number;
  version?: number;

  created_at?: string | Date;
  created_by?: string;

  // For builder/editor views this may include full questions;
  // For play views prefer `QuizForPlay` to avoid leaking answers.
  grade?: string;
  total_marks?: number;
  questions: Question[];
}

// Safe quiz for play (no correct answers included)
export type QuizForPlay = {
  _id: string;
  title: string;
  instructions: string;                // maps to QuizMetadata.description
  subject?: string;
  grade?: string;
  class_id?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  time_limit_sec: number;
  question_count?: number;
  total_marks?: number;
  version: number;
  matchmaking_enabled: boolean;
  async_enabled: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  questions: SafeQuestion[];
};

// ==============================
// Editor component props
// ==============================

export interface QuestionEditorProps {
  question: Question;
  index: number;
  totalQuestions?: number;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onUpdate: (index: number, updatedQuestion: Question) => void;
  onRemove: (index: number) => void;
}

// ==============================
// Payloads sent to backend
// ==============================

export interface QuestionPayload {
  type: QuestionType;
  subject?: string; // backend supports generic subjects
  question: string;
  explanation?: string;
  options?: string[];
  correct_answer: string | number | boolean | (string | number)[];
  marks: number; // required by backend schema
  sliderRange?: {
    min: number;
    max: number;
    step: number;
  };
  dragItems?: {
    items: string[];
    matches: string[];
  };
  image?: string;
  formula?: string;
  meta?: Record<string, unknown>;
}

// Payload when submitting quiz answers
export interface QuizSubmissionPayload {
  quizId: string;
  time_spent?: number; // total seconds (optional; backend will derive if per-q times provided)
  answers: {
    question_id: string;
    answer: string | number | boolean | (string | number)[];
    time_ms?: number; // optional per-question time in ms
  }[];
}

// ==============================
// Performance / attempts
// ==============================

export interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  paperTitle: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // minutes or seconds depending on your UI (backend stores seconds)
  date: Date | string;
}

export interface PerformanceFilter {
  classId?: string;
  subject?: string;
  month?: string; // "YYYY-MM"
}

export interface PerformanceTrackerProps {
  userRole: string;
  classes?: { id: string; name: string }[];
  data: QuizAttempt[];
  loading?: boolean;
  onFiltersChange?: (filters: PerformanceFilter) => void;
  currentStudentId?: string;
}

export interface PerformanceStat {
  count: number;
  avg_percent: number;
  max_percent: number;
}

export interface UserPerformanceComparison {
  user: PerformanceStat;
  grade: PerformanceStat;
  class: PerformanceStat;
  global: PerformanceStat;
  meta: {
    grade: string | null;
    enrolled_classes_count: number;
  };
}

// ==============================
// Leaderboards
// ==============================

export type LeaderboardScopeType = "global" | "subject" | "class" | "quiz";
export type LeaderboardWindow = "lifetime" | "weekly" | "monthly";
export type LeaderboardMetric = "average_score" | "efficiency" | "elo";

export type LeaderboardParams = {
  scope_type?: LeaderboardScopeType; // default 'global'
  scope_id?: string;                  // for classes/quiz scopes
  subject?: string;                   // for subject scope
  window?: LeaderboardWindow;         // default 'monthly'
  window_key?: string;                // e.g., '2025-08' or '2025-W32'; auto if omitted
  metric?: LeaderboardMetric;         // default 'average_score'
  limit?: number;                     // default 100
};

// First-attempt leaderboard row
export type FirstAttemptRow = {
  userId: string;
  name: string;
  email?: string;
  percent: number;
  submitted_at: string;
};
