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
  LayoutGrid,
  List as ListIcon,
  Mail,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { ApplicationStatusBadge } from "./application-status-badge";
import { DocumentViewerDialog } from "./document-viewer-dialog";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";

// services
import {
  getApplications,
  handleApplication as handleApplicationAPI,
  getAllClassesWithStudents,
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

const mapApiToUi = (item: ApplicationItem): Application => {
  const docUrl = item.supporting_document || "";

  const document = docUrl
    ? {
        id: `doc-${item._id}`,
        name: fileNameFromUrl(docUrl),
        type: inferDocType(docUrl),
        url: docUrl,
        size: "",
        uploadedAt: item.createdAt,
      }
    : undefined;

  const studentName =
    item.user?.name ||
    (item.user as any)?.username ||
    item.user?.email ||
    "—";

  const className = item.class?.title || item.class?.code || "—";

  const classId =
    (item.class?._id as any)?.toString?.() ||
    (item.class_id as unknown as string) ||
    "";

  return {
    id: item._id,
    studentId: item.user?._id || "",
    studentName,
    studentEmail: item.user?.email || "",
    studentAvatar: (item.user?.avatar as string) || "",
    studentGrade: item.class?.grade ? `Grade ${item.class.grade}` : "—",
    classId,
    className,
    status: (item.status as ApplicationStatus) || "pending",
    appliedAt: item.createdAt,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [errorApps, setErrorApps] = useState<string | null>(null);

  // --- Enrolled Students State ---
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithStudents[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [errorStudents, setErrorStudents] = useState<string | null>(null);
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");

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
              return {
                _id: user._id,
                full_name: user.name || user.username || user.email,
                email: user.email,
                student_profile: user.student_profile,
                enrollment_details: null
              } as EnrolledStudent;
            }
            return null;
          }).filter(Boolean) as EnrolledStudent[];
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
        header: "Student",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 rounded-lg border border-slate-200 shadow-2xs">
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">
                {row.studentName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 block truncate">
                {row.studentName}
              </span>
            </div>
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
    []
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

                <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Applications Grid/List */}
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
              <div className={cn(
                "grid gap-6",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {applications.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {viewMode === "grid" ? (
                        <div className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-start justify-between mb-6">
                            <div className="relative">
                              <Avatar className="w-16 h-16 rounded-2xl border-2 border-white shadow-md">
                                <AvatarImage src={app.studentAvatar} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
                                  {app.studentName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-50">
                                <Clock className="w-3 h-3 text-amber-500" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {appliedOn(app.appliedAt)}
                              </span>
                              <ApplicationStatusBadge status={app.status} className="shadow-none border-0" />
                            </div>
                          </div>

                          <div className="space-y-1 mb-6">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {app.studentName}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="text-xs truncate">{app.studentEmail}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applying for</p>
                                <p className="text-sm font-bold text-slate-800 truncate">{app.className}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="rounded-2xl h-11 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs gap-2"
                              onClick={() => handleViewDocument(app)}
                              disabled={!app.document}
                            >
                              <FileText className="w-4 h-4" />
                              Review
                            </Button>
                            <Button 
                              className="rounded-2xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-200 gap-2"
                              onClick={() => handleApproveApplication(app.id)}
                            >
                              Approve
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>

                          <button 
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"
                            onClick={() => handleRejectApplication(app.id)}
                            title="Reject Application"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="group bg-white rounded-3xl border border-slate-100 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all">
                          <Avatar className="w-12 h-12 rounded-xl border-2 border-white shadow-sm">
                            <AvatarImage src={app.studentAvatar} />
                            <AvatarFallback className="font-bold">{app.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 text-center md:text-left">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{app.studentName}</h4>
                            <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {app.studentEmail}
                            </p>
                          </div>

                          <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</span>
                            <span className="text-sm font-bold text-slate-700">{app.className}</span>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied</span>
                              <span className="text-xs font-semibold text-slate-600">{appliedOn(app.appliedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleViewDocument(app)}
                                disabled={!app.document}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="rounded-xl h-10 px-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 font-bold text-xs"
                                onClick={() => handleApproveApplication(app.id)}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleRejectApplication(app.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
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
            {/* Student Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700">Filter by Class:</span>
              </div>
              <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                <SelectTrigger className="w-full md:w-[260px] h-9 bg-slate-50 border-slate-200 rounded-lg text-xs">
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
          className={selectedAppForAction.className}
          onApprove={() => handleApproveApplication(selectedAppForAction.id)}
          onReject={(reason) => handleRejectApplication(selectedAppForAction.id)}
        />
      )}
    </div>
  );
}
