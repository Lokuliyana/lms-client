// services/classService.ts
import API from "@/lib/axios";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";

/* ===========================
 * Types
 * =========================== */

export type ClassPayload = {
  title: string;
  description: string;
  subject: 'mathematics' | 'science';
  grade: '6' | '7' | '8' | '9' | '10' | '11';
  type: 'special' | 'regular' | 'custom';
  format: 'theory' | 'revision' | 'seminar'; 
  classTime?: { day: string; start: string; end: string }[];
  classFee?: number;
  batches?: { day: string; start: string; end: string }[];
  price?: number;
  image?: string;
  start_date?: string;
  end_date?: string;
  created_by?: string;
};

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface GetApplicationsFilters {
  classId?: string | string[]; // maps to class_id
  status?: ApplicationStatus;
  studentId?: string; // user_id
  search?: string; // student
  classSearch?: string; // class
  appliedFrom?: string | Date; // YYYY-MM-DD or Date
  appliedTo?: string | Date; // YYYY-MM-DD or Date
}

export interface GetApplicationsOptions {
  page?: number; // default 1
  limit?: number; // default 20
  sortBy?: "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
  managedOnly?: boolean; // server interprets (teachers)
  asAdmin?: boolean; // ignored by your server; safe to send or omit
}

export interface ApplicationUser {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string | null;
}

export interface ApplicationClass {
  _id: string;
  title?: string;
  code?: string;
  grade?: string | number;
  section?: string;
}

export interface ApplicationItem {
  _id: string;
  user_id: string;
  class_id: string;
  status: ApplicationStatus;
  supporting_document?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: ApplicationUser;
  class?: ApplicationClass;
}

export interface GetApplicationsResponse {
  data: ApplicationItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecordingItem {
  _id: string;
  class_id: string;
  title?: string;
  url?: string;
  month_key?: string; // "YYYY-MM"
  created_at?: string; // legacy or server field
  createdAt?: string; // if timestamps
  [k: string]: unknown;
}

export interface ClassListItem {
  _id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  price: number;
  image?: string;
  batches?: { batch_name: string; day: string; start: string; end: string }[];
  // Enrichment for UI:
  labels?: { value: string; group: string }[];
  classTime?: { day: string; start: string; end: string }[];
  classFee?: number;
  // If backend already attaches recordings/entitlements:
  recordings?: RecordingItem[];
  accessibleMonths?: string[];
  hasAccessThisMonth?: boolean;
  [k: string]: unknown;
}

export interface ClassDetail extends ClassListItem {
  recordings: RecordingItem[];
  accessibleMonths: string[];
  hasAccessThisMonth: boolean;
}

/** Entitlements API types */
export type EntitlementGrantResponse = {
  message: string;
  ok?: boolean;
  month_key: string;
};

export type BulkGrantResponse = {
  message: string;
  ok?: boolean;
  month_key: string;
  upserted?: number;
};

export type ListMonthsResponse = {
  classId: string;
  userId: string;
  months: string[];
};

export type CanAccessResponse = {
  classId: string;
  userId: string;
  month: string;
  canAccess: boolean;
};

/* ===========================
 * Helpers
 * =========================== */

const is24Hex = (s?: string) => !!s && /^[a-fA-F0-9]{24}$/.test(s);
const toYMD = (d: string | Date) =>
  typeof d === "string" ? d : d.toISOString().slice(0, 10);
const isMonthKey = (s?: string) => !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
function isYearMonth(s?: string | null): s is string {
  if (!s) return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
const authHeader = (token?: string): Record<string, string> => {
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
};

/* ===========================
 * Class CRUD & Queries
 * =========================== */

// CREATE CLASS (map UI -> backend)
export const createClass = async (classData: ClassPayload | any) => {
  const resolvedBatches =
    Array.isArray(classData.batches) && classData.batches.length > 0
      ? classData.batches
      : Array.isArray(classData.batch_schedule) && classData.batch_schedule.length > 0
      ? classData.batch_schedule
      : Array.isArray(classData.classTime)
      ? classData.classTime.map(({ day, start, end }: any) => ({ day, start, end }))
      : [];

  const resolvedPrice =
    typeof classData.price === 'number'
      ? classData.price
      : typeof classData.classFee === 'number'
      ? classData.classFee
      : typeof classData.fees === 'number'
      ? classData.fees
      : typeof classData.price === 'string' && !isNaN(Number(classData.price))
      ? Number(classData.price)
      : typeof classData.fee === 'number' || (typeof classData.fee === 'string' && !isNaN(Number(classData.fee)))
      ? Number(classData.fee)
      : undefined;

  const payload = {
    title: classData.title,
    description: classData.description,
    subject: classData.subject,
    grade: classData.grade,
    type: classData.type || classData.classType || 'regular',
    format: classData.format || classData.classFormat || 'theory',
    image: classData.image,
    batches: resolvedBatches,
    batch_schedule: resolvedBatches,
    price: resolvedPrice,
    fees: resolvedPrice,
    delivery_type: classData.delivery_type || 'online_only',
    start_date: classData.start_date,
    end_date: classData.end_date,
    created_by: classData.created_by,
  };

  const { data } = await API.post('/classes', payload);
  return Array.isArray(data) ? data : (data as any).data || data;
};


// GET CLASSES (server filters recordings by entitlement; we reshape for UI)
export const getClasses = async (filters: Record<string, unknown> = {}) => {
  try {
    const { data } = await API.get<ClassListItem[]>("/classes", {
      params: filters,
    });

    const items = Array.isArray(data) ? data : (data as any).data || [];
    const transformed: ClassListItem[] = items.map((item: any) => ({
      ...item,
      labels: [
        { value: formatGradeName(item.grade), group: "grade" },
        { value: formatSubjectName(item.subject), group: "subject" },
      ],
      classTime: item.batches?.map((b: any) => ({
        day: b.day,
        start: b.start,
        end: b.end,
      })),
      classFee: (item as any).price,
    }));

    return transformed;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw new Error("Error fetching classes");
  }
};

// GET CLASS BY ID (optional month filter -> entitlement-aware backend)
export const getClassById = async (classId: string) => {
  try {
    if (!classId || classId === "undefined" || classId === "null") {
      return null;
    }
    const { data } = await API.get<ClassDetail>(`/classes/${classId}`);
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error("Error fetching class by ID:", error?.message || error);
    throw error;
  }
};

// UPDATE CLASS
export const updateClass = async (
  classId: string,
  classData: Partial<ClassPayload> & Record<string, any>
) => {
  try {
    const payload = {
      ...classData,
      ...(classData.classTime && {
        batches: classData.classTime.map((x: any) => ({
          day: x.day,
          start: x.start,
          end: x.end,
        })),
      }),
      ...(typeof classData.classFee === "number" && {
        price: classData.classFee,
      }),
      ...(classData.format && { format: classData.format }),
    };

    const { data } = await API.put(`/classes/${classId}`, payload);
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error) {
    console.error("Error updating class:", error);
    throw new Error("Error updating class");
  }
};

// DELETE CLASS
export const deleteClass = async (classId: string) => {
  try {
    const { data } = await API.delete(`/classes/${classId}`);
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error) {
    console.error("Error deleting class:", error);
    throw new Error("Error deleting class");
  }
};

/* ===========================
 * Applications (apply/handle/list)
 * =========================== */

// APPLY FOR CLASS
export type ApplyForClassResponse = {
  message: string;
  ok?: boolean;
  applicationId?: string;
  [key: string]: any;
};

const applyForClass = async (
  classId: string,
  supportingDocumentUrl?: string | null,
  month?: string | null
) => {
  if (supportingDocumentUrl && supportingDocumentUrl.startsWith("data:")) {
    throw new Error("applyForClass expected a URL, received a data URI.");
  }

  const payload: {
    class_id: string;
    supporting_document: string | null;
    month?: string;
  } = {
    class_id: classId,
    supporting_document: supportingDocumentUrl ?? null,
  };

  if (isYearMonth(month)) payload.month = month;

  const { data } = await API.post("/classes/apply", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return Array.isArray(data) ? data : (data as any).data || data;
};

// HANDLE APPLICATION (approve/reject)
const handleApplication = async (
  applicationId: string,
  status: "approved" | "rejected"
) => {
  try {
    const { data } = await API.post("/classes/handle", {
      application_Id: applicationId,
      status,
    });
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error) {
    console.error("Error handling application:", error);
    throw new Error("Failed to handle the class application.");
  }
};

// GIVE ACCESS TO ALL (teacher bulk for same-grade students)
const giveAccessToAll = async (classId: string) => {
  try {
    const { data } = await API.post("/classes/give-access", { classId });
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error) {
    console.error("Error giving access to all students:", error);
    throw new Error("Failed to give access to all students.");
  }
};

/* ===========================
 * Applications listing (filters/pagination/sorting)
 * =========================== */

const getApplications = async (
  filters: GetApplicationsFilters = {},
  options: GetApplicationsOptions = {},
  signal?: AbortSignal
): Promise<GetApplicationsResponse> => {
  const params = new URLSearchParams();

  // class_id (supports array/comma-separated)
  const cid = filters.classId;
  if (Array.isArray(cid)) {
    const valid = cid.filter(is24Hex);
    if (valid.length) params.set("class_id", valid.join(","));
  } else if (typeof cid === "string" && is24Hex(cid)) {
    params.set("class_id", cid);
  }

  if (filters.status) params.set("status", filters.status);
  if (filters.studentId && is24Hex(filters.studentId))
    params.set("student_id", filters.studentId);
  if (filters.search) params.set("search", filters.search);
  if (filters.classSearch) params.set("class_search", filters.classSearch);

  if (filters.appliedFrom)
    params.set("applied_from", toYMD(filters.appliedFrom));
  if (filters.appliedTo) params.set("applied_to", toYMD(filters.appliedTo));

  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.sortBy) params.set("sortBy", options.sortBy);
  if (options.sortOrder) params.set("sortOrder", options.sortOrder);
  if (options.managedOnly !== undefined)
    params.set("managedOnly", String(options.managedOnly));
  if (options.asAdmin !== undefined)
    params.set("asAdmin", String(options.asAdmin));

  const url = `/classes/applications?${params.toString()}`;
  const { data } = await API.get<GetApplicationsResponse>(url, { signal });
  return Array.isArray(data) ? data : (data as any).data || data;
};

/* ===========================
 * Entitlements (monthly access)
 * =========================== */

// Teacher: grant a single user a month entitlement (defaults to current month).
const grantMonthlyEntitlement = async (
  classId: string,
  userId: string,
  opts?: {
    month?: string;
    paidAt?: string;
    paymentRef?: string;
    source?: string;
  }
) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  if (!is24Hex(userId)) throw new Error("Invalid userId");
  if (opts?.month && !isMonthKey(opts.month))
    throw new Error("month must be YYYY-MM");

  const { data } = await API.post<EntitlementGrantResponse>(
    `/classes/${classId}/entitlements/grant`,
    {
      userId,
      month: opts?.month, // if omitted, server will use current month (Asia/Colombo)
      paidAt: opts?.paidAt,
      paymentRef: opts?.paymentRef,
      source: opts?.source || "manual",
    }
  );
  return Array.isArray(data) ? data : (data as any).data || data;
};

// Teacher: bulk grant a month entitlement to many users.
const bulkGrantMonthToUsers = async (
  classId: string,
  userIds: string[],
  opts?: { month?: string; paidAt?: string; source?: string }
) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  if (!Array.isArray(userIds) || userIds.length === 0)
    throw new Error("userIds must be a non-empty array");
  if (userIds.some((id) => !is24Hex(id)))
    throw new Error("One or more userIds are invalid");
  if (opts?.month && !isMonthKey(opts.month))
    throw new Error("month must be YYYY-MM");

  const { data } = await API.post<BulkGrantResponse>(
    `/classes/${classId}/entitlements/bulk-grant`,
    {
      userIds,
      month: opts?.month,
      paidAt: opts?.paidAt,
      source: opts?.source || "manual",
    }
  );
  return Array.isArray(data) ? data : (data as any).data || data;
};

// Authenticated user: list my months for a class.
const listMyMonthKeys = async (classId: string) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  const { data } = await API.get<ListMonthsResponse>(
    `/classes/${classId}/entitlements/my`
  );
  return Array.isArray(data) ? data : (data as any).data || data;
};

// Teacher: list another user's months for a class.
const listUserMonthKeys = async (classId: string, userId: string) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  if (!is24Hex(userId)) throw new Error("Invalid userId");
  const { data } = await API.get<ListMonthsResponse>(
    `/classes/${classId}/entitlements/user/${userId}`
  );
  return Array.isArray(data) ? data : (data as any).data || data;
};

// Authenticated user: check if I can access a specific month (YYYY-MM).
const userCanAccessMonth = async (classId: string, month: string) => {
  if (!is24Hex(classId)) throw new Error("Invalid classId");
  if (!isMonthKey(month)) throw new Error("month must be YYYY-MM");
  const { data } = await API.get<CanAccessResponse>(
    `/classes/${classId}/entitlements/check`,
    {
      params: { month },
    }
  );
  return Array.isArray(data) ? data : (data as any).data || data;
};

/* ===========================
 * Enrolled Students (Teacher/Moderator)
 * =========================== */

export interface EnrolledStudent {
  _id: string;
  full_name: string;
  email: string;
  student_profile?: any;
  enrollment_details?: any;
}

export interface ClassWithStudents {
  _id: string;
  title: string;
  students: EnrolledStudent[];
  enrolled_students?: string[]; // IDs of enrolled students
}

export const getAllClassesWithStudents = async () => {
  try {
    const { data } = await API.get<ClassWithStudents[]>("/classes/students/all");
    return Array.isArray(data) ? data : (data as any).data || data;
  } catch (error) {
    console.error("Error fetching classes with students:", error);
    throw new Error("Failed to fetch enrolled students.");
  }
};

/* ===========================
 * Student Enrolled Classes
 * =========================== */

export const getMyEnrolledClasses = async () => {
  try {
    const { data } = await API.get<any[]>("/classes/enrolled");
    const items = Array.isArray(data) ? data : (data as any).data || [];
    return items.map((item: any) => ({
      ...item,
      labels: item.labels || [
        { value: formatGradeName(item.grade), group: "grade" },
        { value: formatSubjectName(item.subject), group: "subject" },
      ],
      classTime: item.batches?.map((b: any) => ({
        day: b.day,
        start: b.start,
        end: b.end,
      })),
      classFee: item.price,
      hasAccessThisMonth: item.has_access_this_month,
      accessibleMonths: item.accessible_months,
    })) as ClassListItem[];
  } catch (error) {
    console.error("Error fetching enrolled classes:", error);
    throw new Error("Failed to fetch enrolled classes.");
  }
};

const createMeetingTicket = async (classId: string, mode: 'join' | 'start') => {
  const { data } = await API.post<{ ticket: string; redirect: string }>('/meetings/ticket', {
    classId,
    mode,
  });
  return Array.isArray(data) ? data : (data as any).data || data;
};
