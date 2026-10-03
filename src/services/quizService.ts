// services/api.quiz-and-challenge.ts
import API from "@/lib/axios";
import { LeaderboardParams } from "@/types/quiz";

/* =============================
 * Types
 * ============================= */
export type QuizPayload = {
  title: string;
  instructions: string;
  class_id?: string;
  subject?: string;
  grade?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  time_limit_sec?: number;
  question_count?: number;
  matchmaking_enabled?: boolean;
  async_enabled?: boolean;
  is_active?: boolean;
  is_delete?: boolean;
};

export type QuestionType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "multiple-select"
  | "slider"
  | "drag-drop";

export type QuestionPayload = {
  type: QuestionType;
  question: string;
  subject?: string;
  options?: string[];
  correct_answer: string | number | boolean | (string | number)[];
  explanation?: string;
  marks: number;
  sliderRange?: { min: number; max: number; step: number };
  dragItems?: { items: string[]; matches: string[] };
  image?: string;
  formula?: string;
  meta?: Record<string, unknown>;
};

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

export type QuizForPlay = {
  _id: string;
  title: string;
  instructions: string;
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

export type QuizForUpdate = {
  _id: string;
  frontend_id?: string;
  title: string;
  instructions: string;
  subject?: string;
  class_id?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  time_limit_sec: number;
  question_count?: number;
  version: number;
  matchmaking_enabled: boolean;
  async_enabled: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  questions: SafeQuestion[];
  correct_answer: string | number | boolean | (string | number)[];
  explanation?: string;
};

export type QuizSubmissionPayload = {
  quizId: string;
  time_spent: number; // seconds
  answers: {
    question_id: string;
    answer: string | number | boolean | (string | number)[];
    time_ms?: number; // optional per-question time (ms)
  }[];
};

export type ChallengeMode = "live" | "async";

export type ChallengeMatch = {
  _id: string;
  quiz_id: string;
  mode: ChallengeMode;
  status: "queued" | "in_progress" | "completed" | "expired" | "cancelled";
  p1_id: string;
  p2_id?: string;
  class_id?: string;
  requires_enrollment: boolean;
  question_seed: string;
  quiz_version: number;
  time_limit_sec: number;
  started_at?: string | null;
  completed_at?: string | null;
  winner?: string | null;
  tiebreak?: "faster_time" | "sudden_death" | "none";
  p1_elo_before?: number;
  p1_elo_after?: number;
  p2_elo_before?: number;
  p2_elo_after?: number;
  p1_score_pct?: number;
  p2_score_pct?: number;
  p1_time_ms?: number;
  p2_time_ms?: number;
};

export type FriendListItem = {
  _id: string;
  full_name: string;
  email: string;
  profile?: {
    grade?: string;
    school?: string;
    profile_picture?: string | null;
  };
  metrics?: {
    score: number;
    gradeMatch: number;
    sameClass: boolean;
    duels: number;
    lastPlayed?: string;
  };
};

/* =============================
 * QUIZZES  (routes/quiz.js)
 * ============================= */

// CREATE QUIZ
export const createQuiz = async (quizData: QuizPayload) => {
  const { data } = await API.post("/quizzes/create", quizData);
  return data as { message: string; quiz: any };
};

// ADD QUESTIONS TO A QUIZ
export const addQuestionsToQuiz = async (quizId: string, questions: QuestionPayload[]) => {
  const { data } = await API.post(`/quizzes/${quizId}/questions`, { questions });
  return data as { message: string };
};

// UPDATE A QUIZ QUESTION
export const updateQuizQuestion = async (
  questionId: string,
  questionData: Partial<QuestionPayload>
) => {
  const { data } = await API.put(`/quizzes/questions/${questionId}`, questionData);
  return data as { message: string; question: any };
  return data as { message: string; question: any };
};

export const deleteQuizQuestion = async (questionId: string) => {
  const { data } = await API.delete(`/quizzes/questions/${questionId}`);
  return data as { message: string };
};

export const updateQuiz = async (
  quizId: string,
  quizData: Partial<QuizPayload>
) => {
  const { data } = await API.put(`/quizzes/${quizId}`, quizData);
  return data as { message: string; quiz: any };
};

// UPSERT QUIZ AND QUESTIONS
export const upsertQuiz = async (quizData: any) => {
  const payload = {
    ...quizData,
    instructions: quizData.description || quizData.instructions,
    questions: (quizData.questions || []).map((q: any) => {
      let correct_answer: any;

      // Handle both camelCase and snake_case for flexibility
      const rawCorrect = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_answer;

      switch (q.type) {
        case "mcq":
        case "slider":
          correct_answer = Number(rawCorrect);
          break;
        case "true-false":
          correct_answer = String(rawCorrect) === "true";
          break;
        case "fill-blank":
          correct_answer = String(rawCorrect ?? "");
          break;
        case "multiple-select":
        case "drag-drop":
          correct_answer = Array.isArray(rawCorrect)
            ? rawCorrect.map((val: any) => Number(val))
            : [];
          break;
        default:
          correct_answer = rawCorrect;
      }

      return {
        ...q,
        correct_answer,
        // sanitize fields for backend
        marks: Number(q.marks) || 1,
        image: q.image || undefined,
        explanation: q.explanation || "",
      };
    }),
  };

  const { data } = await API.post("/quizzes/upsert", payload);
  return data as { message: string; quiz: any };
};

// SAFE: GET ALL QUIZZES FOR PLAY (no answers)
export const getAllQuizzesForPlay = async () => {
  const { data } = await API.get("/quizzes/all");
  return data as QuizForPlay[];
};

// SAFE: GET QUIZ BY ID FOR PLAY (no answers)
export const getQuizByIdForPlay = async (quizId: string) => {
  const { data } = await API.get(`/quizzes/${quizId}`);
  return data as QuizForPlay;
};

export const getQuizByIdForUpdate = async (quizId: string) => {
  const { data } = await API.get(`/quizzes/admin/${quizId}`);
  return data as QuizForUpdate;
};

// SUBMIT QUIZ ANSWERS
export const submitQuiz = async (payload: QuizSubmissionPayload) => {
  const { data } = await API.post(`/quizzes/${payload.quizId}/submit`, {
    answers: payload.answers,
    time_spent: payload.time_spent,
  });
  return data as { message: string; submission: { _id: string } };
};

// Fetch a specific quiz submission with full review data (owner only)
export const getQuizSubmissionById = async (submissionId: string) => {
  const { data } = await API.get(`/quizzes/submission/${submissionId}`);
  return data;
};

// Student-level performance
export const getStudentPerformance = async ({
  userId,
  month,
}: {
  userId: string;
  month?: string;
}) => {
  const { data } = await API.get("/quizzes/performance/user", {
    params: { user_id: userId, ...(month && { month }) },
  });
  return data;
};

// Admin aggregated performance
export const getAdminPerformance = async ({
  classId,
  subject,
  month,
}: {
  classId?: string;
  subject?: string;
  month?: string;
}) => {
  const { data } = await API.get("/quizzes/performance/admin", {
    params: {
      ...(classId && { class_id: classId }),
      ...(subject && { subject }),
      ...(month && { month }),
    },
  });
  return data;
};

// Teacher aggregated performance
export const getTeacherPerformance = async ({
  classId,
  subject,
  month,
}: {
  classId?: string;
  subject?: string;
  month?: string;
}) => {
  const { data } = await API.get("/quizzes/performance/teacher", {
    params: {
      ...(classId && { class_id: classId }),
      ...(subject && { subject }),
      ...(month && { month }),
    },
  });
  return data;
};

// Teacher view: specific user performance
export const getTeacherUserPerformance = async (userId: string) => {
  const { data } = await API.get("/quizzes/performance/teacher/user", {
    params: { user_id: userId },
  });
  return data as import("@/types/quiz").UserPerformanceComparison;
};

// Aggregated leaderboards (UserPerformance)
export const getLeaderboard = async (params: LeaderboardParams = {}) => {
  const { data } = await API.get("/quizzes/leaderboard", { params });
  return data as {
    params: LeaderboardParams & { window_key?: string };
    count: number;
    results: Array<{
      userId: string;
      name?: string;
      avatar?: string;
      attempts: number;
      averageScore: number;
      efficiency: number;
      consistency: number;
      elo: number;
      lastAttemptAt?: string;
    }>;
  };
};

export const getMyLeaderboardPosition = async (
  params: Omit<LeaderboardParams, "limit"> = {}
) => {
  const { data } = await API.get("/quizzes/leaderboard/me", { params });
  return data as {
    position: number | null;
    me: {
      userId: string;
      attempts: number;
      averageScore: number;
      efficiency: number;
      consistency: number;
      elo: number;
    } | null;
  };
};

// First-attempt leaderboard for a quiz (optional ?grade=&classId=)
export const getFirstAttemptLeaderboard = async ({
  quizId,
  limit,
  grade,
  classId,
}: {
  quizId: string;
  limit?: number;
  grade?: string;
  classId?: string;
}) => {
  const { data } = await API.get(`/quizzes/${quizId}/leaderboard/first-attempt`, {
    params: {
      ...(limit != null ? { limit } : {}),
      ...(grade ? { grade } : {}),
      ...(classId ? { classId } : {}),
    },
  });
  return data as { count: number; results: Array<{ userId: string; name: string; email: string; percent: number; submitted_at: string }> };
};

/* =============================
 * CHALLENGES (routes/challenge.js)
 * ============================= */

// Create a targeted async challenge (requires opponentId)
export const createChallenge = async (payload: { quizId: string; opponentId: string }) => {
  const { data } = await API.post("/challenges/create", payload);
  return data as { message: string; match: ChallengeMatch };
};

// Optional accept (parity; not required for async flow)
export const acceptChallenge = async (matchId: string) => {
  const { data } = await API.post(`/challenges/${matchId}/accept`);
  return data as { message: string; match: ChallengeMatch };
};

// Attach a finished QuizSubmission to a challenge
export const submitChallengeAttempt = async (matchId: string, submissionId: string) => {
  const { data } = await API.post(`/challenges/${matchId}/submit`, {
    submission_id: submissionId,
  });
  return data as { message: string; match: ChallengeMatch };
};

// Prioritized friend list (students only)
export const getFriendList = async (params?: { limit?: number; recentDays?: number }) => {
  const { data } = await API.get("/challenges/friends", {
    params: {
      ...(params?.limit != null ? { limit: params.limit } : {}),
      ...(params?.recentDays != null ? { recentDays: params.recentDays } : {}),
    },
  });
  return data as { count: number; results: FriendListItem[] };
};

// List my challenges (optional filter ?status=queued|in_progress|completed|expired|cancelled)
export const getMyChallenges = async (status?: string) => {
  const { data } = await API.get("/challenges/mine", {
    params: status ? { status } : {},
  });
  return data as { count: number; results: ChallengeMatch[] };
};

export const fetchQuizzes = getAllQuizzesForPlay;

export const quizService = {
  createQuiz,
  fetchQuizzes,
  getAllQuizzesForPlay,
  getQuizByIdForPlay,
  getQuizByIdForUpdate,
  updateQuiz,
  upsertQuiz,
  addQuestionsToQuiz,
  updateQuizQuestion,
  deleteQuizQuestion,
  submitQuiz,
  getQuizSubmissionById,
  getStudentPerformance,
  getAdminPerformance,
  getTeacherPerformance,
};

export default quizService;

