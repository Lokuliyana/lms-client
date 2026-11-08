"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/dev/card";
import { Button } from "@/components/dev/button";
import { Input } from "@/components/dev/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dev/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dev/select";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import { ApplicationStatusBadge } from "./application-status-badge";
import { DocumentViewerDialog } from "./document-viewer-dialog";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { toast } from "sonner";
import { ManualEnrollModal } from "@/components/ui/class-view/ManualEnrollModal";

// services
import {
  getApplications,
  handleApplication as handleApplicationAPI,
  getAllClassesWithStudents,
  revokeStudentAccess,
  type ApplicationItem,
  type ApplicationStatus,
  type ClassWithStudents,
  type EnrolledStudent,
} from "@/services/classService";
import { authService } from "@/services/authService";

/* ===========================
 * Local types / helpers
 * =========================== */
interface DocumentT {
  id: string;
  name: string;
  type: "image" | "pdf";
  url: string;
  size: string;
  uploadedAt: string;
}

interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentAvatar: string;
  studentGrade: string;
  classId: string;
  className: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
  document?: DocumentT;
}

interface ClassOption {
  id: string;
  name: string;
}

const appliedOn = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const inferDocType = (url: string): "image" | "pdf" => {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  return "image";
};

const fileNameFromUrl = (url: string) => {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split("/").pop() || "document");
  } catch {
    return "document";
  }
};

const resolveDocUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:4002";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

const mapApiToUi = (item: any): Application => {
  const rawDoc = item.supporting_document || "";
  const docUrl = resolveDocUrl(rawDoc);

  const document = docUrl
    ? {
        id: `doc-${item._id}`,
        name: fileNameFromUrl(rawDoc || docUrl),
        type: inferDocType(rawDoc || docUrl),
        url: docUrl,
        size: "",
        uploadedAt: item.applied_at || item.createdAt || new Date().toISOString(),
      }
    : undefined;

  const userObj =
    (item.user && typeof item.user === "object" ? item.user : null) ||
    (item.student && typeof item.student === "object" ? item.student : null) ||
    (item.user_id && typeof item.user_id === "object" ? item.user_id : null) ||
    (item.student_id && typeof item.student_id === "object" ? item.student_id : null) ||
    {};

  const classObj =
    (item.class && typeof item.class === "object" ? item.class : null) ||
    (item.class_id && typeof item.class_id === "object" ? item.class_id : null) ||
    {};

  const firstName = userObj.first_name || userObj.firstName || "";
  const lastName = userObj.last_name || userObj.lastName || "";
  const studentName =
    userObj.computedName ||
    (firstName ? `${firstName} ${lastName}`.trim() : null) ||
    userObj.full_name ||
    userObj.fullName ||
    userObj.name ||
    userObj.username ||
    userObj.email ||
    "—";

  const studentEmail = userObj.email || "—";
  const studentPhone = userObj.phone || userObj.phoneNumber || userObj.contact_phone || "—";
  const studentAvatar = userObj.avatar || "";

  const className = classObj.title || classObj.class_code || classObj.code || "—";

  const classId =
    classObj._id?.toString?.() ||
    (typeof item.class_id === "string" ? item.class_id : "") ||
    "";

  return {
    id: item._id,
    studentId: userObj._id || (typeof item.user_id === "string" ? item.user_id : ""),
    studentName,
    studentEmail,
    studentPhone,
    studentAvatar,
    studentGrade: classObj.grade ? `Grade ${classObj.grade}` : (userObj.grade ? `Grade ${userObj.grade}` : "—"),
    classId,
    className,
    status: (item.status as ApplicationStatus) || "pending",
    appliedAt: item.applied_at || item.createdAt || new Date().toISOString(),
    document,
  };
};

/* ===========================
 * Component
 * =========================== */
export function ClassApplicationsDashboard() {
  const [activeTab, setActiveTab] = useState<"applications" | "students">("applications");

  // --- Applications State ---
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [errorApps, setErrorApps] = useState<string | null>(null);

  // --- Enrolled Students State ---
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithStudents[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [errorStudents, setErrorStudents] = useState<string | null>(null);
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<{ id: string; name: string } | null>(null);

  // Dialog state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentT | undefined>(undefined);
  const [selectedAppForAction, setSelectedAppForAction] = useState<Application | null>(null);

  // --- Fetch Applications ---
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    setErrorApps(null);
    try {
      const filters: any = { status: "pending" }; // Always filter by pending as requested
      if (selectedClass !== "all") filters.classId = selectedClass;
      if (searchQuery.trim().length > 0) filters.search = searchQuery.trim();

      const options: any = { sortBy: "createdAt", sortOrder: "desc" };

      const res = await getApplications(filters, options);
      const mapped = res.data.map(mapApiToUi);
      setApplications(mapped);
    } catch (e: any) {
      console.error(e);
      setErrorApps(e?.message || "Failed to load applications.");
    } finally {
      setLoadingApps(false);
    }
  }, [selectedClass, searchQuery]);

  // --- Fetch Enrolled Students ---
  const fetchEnrolledStudents = useCallback(async () => {
    setLoadingStudents(true);
    setErrorStudents(null);
    try {
      const classesData = await getAllClassesWithStudents();
      const usersRes = await authService.getAllUsers({ limit: 100 });
      const allUsers = Array.isArray(usersRes.data)
        ? usersRes.data
        : (usersRes.data?.users || usersRes.data?.data || []);
      
      const userMap = new Map<string, any>();
      allUsers.forEach((u: any) => {
        if (u._id) userMap.set(u._id, u);
      });

      const mappedClasses = classesData.map((cls: any) => {
        let students = cls.students;
        
        if ((!students || students.length === 0) && cls.enrolled_students && cls.enrolled_students.length > 0) {
          students = cls.enrolled_students.map((studentId: any) => {
            const user = userMap.get(studentId);
            if (user) {
              const firstName = user.first_name || user.firstName || "";
              const lastName = user.last_name || user.lastName || "";
              const fullName =
                (firstName || lastName)
                  ? `${firstName} ${lastName}`.trim()
                  : user.student_profile?.full_name || user.full_name || user.fullName || user.username || user.email;
              return {
                _id: user._id,
                full_name: fullName,
                email: user.email,
                student_profile: user.student_profile,
                enrollment_details: null
              } as EnrolledStudent;
            }
            return null;
          }).filter(Boolean) as EnrolledStudent[];
        } else if (Array.isArray(students)) {
          students = students.map((s: any) => {
            const user = userMap.get(s._id) || s;
            const firstName = user.first_name || user.firstName || "";
            const lastName = user.last_name || user.lastName || "";
            const fullName =
              (firstName || lastName)
                ? `${firstName} ${lastName}`.trim()
                : user.student_profile?.full_name || user.full_name || user.fullName || s.full_name || user.username || user.email;
            return {
              ...s,
              full_name: fullName,
            };
          });
        }
        
        return {
          ...cls,
          students: students || []
        };
      });

      setEnrolledClasses(mappedClasses);
    } catch (e: any) {
      console.error(e);
      setErrorStudents(e?.message || "Failed to load enrolled students.");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchEnrolledStudents();
    }
  }, [activeTab, fetchApplications, fetchEnrolledStudents]);

  // --- Derived State ---
  const classOptions: ClassOption[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of applications) {
      if (a.classId && a.className) map.set(a.classId, a.className);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [applications]);

  const stats = useMemo(() => {
    const total = applications.length;
    return { total };
  }, [applications]);

  const filteredEnrolledClasses = useMemo(() => {
    let classes = enrolledClasses;

    if (studentClassFilter !== "all") {
      classes = classes.filter((c) => c._id === studentClassFilter);
    }

    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      classes = classes.map((c) => ({
        ...c,
        students: c.students.filter(
          (s) =>
            s.full_name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        ),
      })).filter(c => c.students.length > 0);
    }

    return classes;
  }, [enrolledClasses, studentClassFilter, studentSearch]);

  // --- Actions ---
  const handleViewDocument = (app: Application) => {
    if (!app.document) return;
    setSelectedDoc(app.document);
    setSelectedAppForAction(app);
    setDocumentViewerOpen(true);
  };

  const approveOrReject = async (applicationId: string, status: "approved" | "rejected") => {
    try {
      await handleApplicationAPI(applicationId, status);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (e) {
      console.error(e);
      alert(`Failed to ${status} application.`);
    }
  };

  const handleApproveApplication = (applicationId: string) =>
    approveOrReject(applicationId, "approved");

  const handleRejectApplication = (applicationId: string) =>
    approveOrReject(applicationId, "rejected");

  const handleRevoke = async (classId: string, studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to revoke active class access for ${studentName}?`)) {
      return;
    }
    try {
      setRevokingId(studentId);
      const res = await revokeStudentAccess(classId, studentId);
      if (res?.success) {
        toast.success(`Access revoked for ${studentName}`);
        fetchEnrolledStudents();
      } else {
        toast.error(res?.message || "Failed to revoke access.");
      }
    } catch (e: any) {
      console.error("Revoke access error:", e);
      toast.error(e?.response?.data?.message || "Failed to revoke student access.");
    } finally {
      setRevokingId(null);
    }
  };

  // --- Flattened Students Roster for DataTable ---
  const flattenedStudents = useMemo(() => {
    const list: Array<{
      id: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      classId: string;
      className: string;
      status: string;
    }> = [];

    enrolledClasses.forEach((cls) => {
      if (studentClassFilter !== "all" && cls._id !== studentClassFilter) return;
      cls.students.forEach((s) => {
        list.push({
          id: `${cls._id}-${s._id}`,
          studentId: s._id,
          studentName: s.full_name || "Enrolled Student",
          studentEmail: s.email || "-",
          classId: cls._id,
          className: cls.title,
          status: "Active",
        });
      });
    });

    return list;
  }, [enrolledClasses, studentClassFilter]);

  const studentColumns: Column<any>[] = useMemo(
    () => [
      {
        key: "studentName",
        header: "Student Name",
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 block truncate">
              {row.studentName}
            </span>
          </div>
        ),
      },
      {
        key: "className",
        header: "Class Name",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/60">
            <BookOpen className="w-3 h-3 text-slate-500 mr-1.5" />
            {row.className}
          </span>
        ),
      },
      {
        key: "studentEmail",
        header: "Contact Email",
        sortable: true,
        render: (row) => (
          <span className="text-slate-500 text-xs font-mono">{row.studentEmail}</span>
        ),
      },
      {
        key: "status",
        header: "Enrollment Status",
        render: () => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
            Active
          </span>
        ),
      },
      {
        key: "actions",
        header: "Quick Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={revokingId === row.studentId}
              onClick={() => handleRevoke(row.classId, row.studentId, row.studentName)}
              className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-medium"
            >
              {revokingId === row.studentId ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <UserMinus className="w-3.5 h-3.5 mr-1" />
                  Revoke Access
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              asChild
            >
              <a href={`/classes/${row.classId}`}>
                View Class
              </a>
            </Button>
          </div>
        ),
      },
    ],
    [revokingId]
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-20">
      
      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "relative pb-4 text-sm font-semibold transition-all",
              activeTab === "applications" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Applications
              {stats.total > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">
                  {stats.total}
                </span>
              )}
            </div>
            {activeTab === "applications" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={cn(
              "relative pb-4 text-sm font-semibold transition-all",
              activeTab === "students" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Enrolled Students
            </div>
            {activeTab === "students" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
              />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "applications" ? (
          <motion.div
            key="applications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full md:w-[220px] h-12 bg-white border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <SelectValue placeholder="All Classes" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Applications List (List View Only, No Avatars) */}
            {loadingApps ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-slate-500 mt-6 font-medium">Fetching applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
                <p className="text-slate-500 mt-2">No pending applications found for the selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                <AnimatePresence mode="popLayout">
                  {applications.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="group bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all">
                        {/* Student Details (No avatar) */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                            {app.studentName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {app.studentEmail}
                            </span>
                            {app.studentPhone && app.studentPhone !== "—" && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {app.studentPhone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Class Info */}
                        <div className="flex flex-col items-start md:items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                            {app.className}
                          </span>
                        </div>

                        {/* Applied Date & Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="flex flex-col items-start md:items-end gap-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied</span>
                            <span className="text-xs font-semibold text-slate-600">{appliedOn(app.appliedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-xl h-9 px-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 border-slate-200"
                              onClick={() => handleViewDocument(app)}
                              disabled={!app.document}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review Doc
                            </Button>
                            <Button 
                              size="sm" 
                              className="rounded-xl h-9 px-3.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-xs"
                              onClick={() => handleApproveApplication(app.id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="rounded-xl h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleRejectApplication(app.id)}
                              title="Reject Application"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Student Filters & Manual Enroll Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700">Filter by Class:</span>
                <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                  <SelectTrigger className="w-full sm:w-[260px] h-9 bg-slate-50 border-slate-200 rounded-lg text-xs">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Classes ({enrolledClasses.length})</SelectItem>
                    {enrolledClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.title} ({cls.students.length} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const targetClass =
                    studentClassFilter !== "all"
                      ? enrolledClasses.find((c) => c._id === studentClassFilter)
                      : enrolledClasses[0];
                  if (targetClass) {
                    setSelectedClassForEnroll({ id: targetClass._id, name: targetClass.title });
                  } else {
                    setSelectedClassForEnroll(null);
                  }
                  setManualEnrollOpen(true);
                }}
                className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manual Enroll Students</span>
              </Button>
            </div>

            <DataTable
              columns={studentColumns}
              data={flattenedStudents}
              searchPlaceholder="Search enrolled students by name or email..."
              pageSize={10}
              loading={loadingStudents}
              emptyTitle="No enrolled students found"
              emptyDescription="No students enrolled matching the selected search query or class filter."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Enroll Modal */}
      {manualEnrollOpen && (
        <ManualEnrollModal
          isOpen={manualEnrollOpen}
          onClose={() => {
            setManualEnrollOpen(false);
            setSelectedClassForEnroll(null);
          }}
          classId={selectedClassForEnroll?.id}
          className={selectedClassForEnroll?.name}
          availableClasses={enrolledClasses.map((c) => ({ _id: c._id, title: c.title }))}
          onSuccess={() => {
            fetchEnrolledStudents();
          }}
        />
      )}

      {/* Document Viewer */}
      {selectedDoc && selectedAppForAction && (
        <DocumentViewerDialog
          isOpen={documentViewerOpen}
          onClose={() => {
            setDocumentViewerOpen(false);
            setSelectedDoc(undefined);
            setSelectedAppForAction(null);
          }}
          document={selectedDoc}
          studentName={selectedAppForAction.studentName}
          studentEmail={selectedAppForAction.studentEmail}
          studentPhone={selectedAppForAction.studentPhone}
          className={selectedAppForAction.className}
          onApprove={() => handleApproveApplication(selectedAppForAction.id)}
          onReject={(reason) => handleRejectApplication(selectedAppForAction.id)}
        />
      )}
    </div>
  );
}
