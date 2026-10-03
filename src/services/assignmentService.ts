// services/assignmentService.ts
import API from "@/lib/axios";

/* ===========================
 * Types
 * =========================== */

export type Id = string;

export type AssignmentPayload = {
  title: string;
  description?: string;
  due_date: string | Date;     // ISO string or Date
  urls?: string[];             // optional direct links
  file_ids?: string[];         // uploaded /media ids
  max_points?: number;         // default handled server-side (100)
  is_published?: boolean;      // default true
};

export type AssignmentItem = {
  _id: Id;
  class_id: Id;
  title: string;
  description?: string;
  due_date: string;
  urls?: string[];
  file_ids?: Id[];
  max_points?: number;
  created_by: Id;
  is_published: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AssignmentListResponse = {
  data: AssignmentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SubmissionPayload = {
  url?: string | null;
  urls?: string[];
  file_ids?: string[];
  note?: string;
};

export type SubmissionItem = {
  _id: Id;
  assignment_id: Id;
  student_id: Id;
  url?: string | null;
  urls?: string[];
  file_ids?: Id[];
  submitted_at: string;
  updated_at?: string;
  grade?: number | null;
  feedback?: string;
  graded_by?: Id | null;
};

export type SubmissionListResponse = {
  data: SubmissionItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GradePayload = {
  grade?: number;
  feedback?: string;
};

export type SubmissionWithAssignment = {
  _id: Id;
  assignment_id: Id;
  student_id: Id;
  url?: string | null;
  urls?: string[];
  file_ids?: Id[];
  note?: string;
  grade?: number | null;
  feedback?: string;
  graded_by?: Id | null;
  submitted_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  assignment: {
    _id: Id;
    title: string;
    class_id: Id;
    due_date?: string;
  };
};

export type SubmissionAllResponse = {
  data: SubmissionWithAssignment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type SortKey = "submitted_at" | "updated_at" | "createdAt";
type SortOrder = "asc" | "desc";

export type SubmissionNamed = {
  _id: string;
  urls?: string[];
  file_ids?: string[];
  note?: string;
  grade?: number | null;
  feedback?: string;
  graded_by?: string | null;
  submitted_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;

  student_full_name: string;   // from users.full_name
  assignment_title: string;    // from assignments.title
  class_title: string;         // from classes.title
};

export type SubmissionNamedResponse = {
  data: SubmissionNamed[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ===========================
 * Helpers
 * =========================== */

const is24Hex = (s?: string) => !!s && /^[a-fA-F0-9]{24}$/.test(s);
const toISO = (d: string | Date) =>
  typeof d === "string" ? d : d.toISOString();

/* ===========================
 * Assignments
 * =========================== */

// CREATE
export const createAssignment = async (
  classId: Id,
  payload: AssignmentPayload
) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  const body = {
    ...payload,
    due_date: toISO(payload.due_date),
  };
  const { data } = await API.post<{
    message: string;
    assignment: AssignmentItem;
  }>(`/classes/${classId}/assignments`, body);
  return data.assignment;
};

// LIST (by class)
export const listAssignments = async (
  classId: Id,
  opts?: {
    search?: string;
    upcoming_only?: boolean;
    past_only?: boolean;
    page?: number;
    limit?: number;
    sortBy?: "due_date" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
  },
  signal?: AbortSignal
) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");

  const params: Record<string, any> = {};
  if (opts?.search) params.search = opts.search;
  if (opts?.upcoming_only) params.upcoming_only = true;
  if (opts?.past_only) params.past_only = true;
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;
  if (opts?.sortBy) params.sortBy = opts.sortBy;
  if (opts?.sortOrder) params.sortOrder = opts.sortOrder;

  const { data } = await API.get<AssignmentListResponse>(
    `/classes/${classId}/assignments`,
    { params, signal }
  );
  return data;
};

// GET ONE
export const getAssignment = async (assignmentId: Id) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const { data } = await API.get<AssignmentItem>(
    `/classes/assignments/${assignmentId}`
  );
  return data;
};

// UPDATE
export const updateAssignment = async (
  assignmentId: Id,
  patch: Partial<AssignmentPayload>
) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const body = {
    ...patch,
    ...(patch.due_date ? { due_date: toISO(patch.due_date) } : {}),
  };
  const { data } = await API.put<{ message: string; assignment: AssignmentItem }>(
    `/classes/assignments/${assignmentId}`,
    body
  );
  return data.assignment;
};

// DELETE
export const deleteAssignment = async (assignmentId: Id) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const { data } = await API.delete<{ message: string }>(
    `/classes/assignments/${assignmentId}`
  );
  return data.message === "Assignment deleted";
};

/* ===========================
 * Submissions
 * =========================== */

// UPSERT (create/update my submission)
export const upsertSubmission = async (
  assignmentId: Id,
  payload: SubmissionPayload
) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const { data } = await API.post<{ message: string; submission: SubmissionItem }>(
    `/classes/assignments/${assignmentId}/submissions`,
    payload
  );
  return data.submission;
};

// LIST submissions (teacher/moderator)
export const listSubmissions = async (
  assignmentId: Id,
  opts?: { page?: number; limit?: number },
  signal?: AbortSignal
) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const params: Record<string, any> = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;

  const { data } = await API.get<SubmissionListResponse>(
    `/classes/assignments/${assignmentId}/submissions`,
    { params, signal }
  );
  return data;
};

// GET my submission
export const getMySubmission = async (assignmentId: Id) => {
  if (!is24Hex(assignmentId)) throw new Error("Invalid assignmentId");
  const { data } = await API.get<{ submission: SubmissionItem | null }>(
    `/classes/assignments/${assignmentId}/submissions/my`
  );
  return data.submission;
};

// GRADE submission (teacher/moderator)
export const gradeSubmission = async (
  submissionId: Id,
  grade: number | undefined,
  feedback?: string
) => {
  if (!is24Hex(submissionId)) throw new Error("Invalid submissionId");
  const body: GradePayload = {};
  if (grade !== undefined) body.grade = grade;
  if (feedback !== undefined) body.feedback = feedback;

  const { data } = await API.post<{ message: string; submission: SubmissionItem }>(
    `/classes/submissions/${submissionId}/grade`,
    body
  );
  return data.submission;
};

export const listAllSubmissions = async (opts?: {
  class_id?: string;       // optional filter; if absent, backend returns ALL
  assignment_id?: string;  // optional
  student_id?: string;     // optional
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sortBy?: SortKey;
  sortOrder?: SortOrder;
  signal?: AbortSignal;
}) => {
  const params: Record<string, any> = {};
  if (opts?.class_id) params.class_id = opts.class_id;
  if (opts?.assignment_id) params.assignment_id = opts.assignment_id;
  if (opts?.student_id) params.student_id = opts.student_id;
  if (opts?.date_from) params.date_from = opts.date_from;
  if (opts?.date_to) params.date_to = opts.date_to;
  if (opts?.page) params.page = opts.page;
  if (opts?.limit) params.limit = opts.limit;
  if (opts?.sortBy) params.sortBy = opts.sortBy;
  if (opts?.sortOrder) params.sortOrder = opts.sortOrder;

  const { data } = await API.get<SubmissionNamedResponse>("/classes/submissions", {
    params,
    signal: opts?.signal,
  });
  return data;
};