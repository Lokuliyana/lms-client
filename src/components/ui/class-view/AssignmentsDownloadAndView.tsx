"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/dev/card";
import { Button } from "@/components/dev/button";
import { Input } from "@/components/dev/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { Badge } from "@/components/dev/badge";
import {
  BookOpen,
  FileDown,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Eye,
  Users,
  GraduationCap,
  Filter,
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  ArrowRight,
  Download,
  Mail,
  Clock,
  CheckCircle2
} from "lucide-react";

import { SectionHeader } from "@/components/reusable/section-header";
import { cn } from "@/lib/utils";

import {
  listAllSubmissions,
  type SubmissionNamed,
} from "@/services/assignmentService";

/* ---------------- helpers ---------------- */
const isImage = (u: string) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u);
const isPdf = (u: string) => /\.pdf$/i.test(u);
const extFromUrl = (u: string) =>
  (u.split("?")[0].split("#")[0].split(".").pop() || "").toLowerCase();
const safeFileName = (s: string) =>
  s.replace(/[\/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim();

type FetchState = "idle" | "loading" | "error";

type Row = {
  _id: string;
  studentName: string;
  studentEmail?: string;
  assignmentTitle: string;
  className?: string;
  urls: string[];
  submittedAt?: string;
};

export default function AllSubmissionsDownloadAndView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");

  // client-side name filters
  const [className, setClassName] = useState<string>("all");
  const [assignmentTitle, setAssignmentTitle] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // fetch from backend
  const fetchData = useCallback(async () => {
    setFetchState("loading");
    try {
      const res = await listAllSubmissions({
        page: 1,
        limit: 500,
        sortBy: "submitted_at",
        sortOrder: "desc",
      });

      const mapped: Row[] = (res.data || []).map((d: SubmissionNamed) => ({
        _id: d._id,
        studentName: d.student_full_name,
        studentEmail: undefined,
        assignmentTitle: d.assignment_title,
        className: d.class_title,
        urls: d.urls || [],
        submittedAt: d.submitted_at,
      }));

      setRows(mapped);
      setFetchState("idle");
    } catch {
      setRows([]);
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // derive dropdown options
  const classOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.className).filter(Boolean))) as string[],
    [rows]
  );
  const assignmentOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.assignmentTitle))),
    [rows]
  );

  // client-side filtering
  const filtered = useMemo(() => {
    let list = rows;
    if (className !== "all") list = list.filter((r) => (r.className || "—") === className);
    if (assignmentTitle !== "all") list = list.filter((r) => r.assignmentTitle === assignmentTitle);

    const q = searchQ.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        (r.className || "").toLowerCase().includes(q) ||
        r.assignmentTitle.toLowerCase().includes(q)
    );
  }, [rows, className, assignmentTitle, searchQ]);

  // stats
  const stats = useMemo(() => {
    const totalFiles = filtered.reduce((n, r) => n + r.urls.length, 0);
    const uniqueStudents = new Set(filtered.map((r) => r.studentName)).size;
    const uniqueAssignments = new Set(filtered.map((r) => r.assignmentTitle)).size;
    return { totalFiles, uniqueStudents, uniqueAssignments, totalSubmissions: filtered.length };
  }, [filtered]);

  const handleView = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const handleDownload = async (url: string, idx: number, r: Row) => {
    const cls = r.className || "Class";
    const student = r.studentName;
    const aTitle = r.assignmentTitle || "Assignment";
    const ext = extFromUrl(url) || (isPdf(url) ? "pdf" : isImage(url) ? "png" : "file");
    const fileName = `${safeFileName(cls)} - ${safeFileName(student)} - ${safeFileName(aTitle)} - ${idx + 1}.${ext}`;

    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-20 pt-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Submissions</h1>
          <p className="text-slate-500 max-w-2xl">
            Monitor and manage student work across all classes. Review, download, and track progress in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: stats.totalSubmissions, icon: FolderOpen, color: "blue" },
          { label: "Unique Students", value: stats.uniqueStudents, icon: Users, color: "indigo" },
          { label: "Total Files", value: stats.totalFiles, icon: FileText, color: "emerald" },
          { label: "Assignments", value: stats.uniqueAssignments, icon: BookOpen, color: "amber" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-sm group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                    stat.color === "blue" && "bg-blue-50 text-blue-600",
                    stat.color === "indigo" && "bg-indigo-50 text-indigo-600",
                    stat.color === "emerald" && "bg-emerald-50 text-emerald-600",
                    stat.color === "amber" && "bg-amber-50 text-amber-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className={cn(
                  "absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:w-full",
                  stat.color === "blue" && "bg-blue-500 w-12",
                  stat.color === "indigo" && "bg-indigo-500 w-12",
                  stat.color === "emerald" && "bg-emerald-500 w-12",
                  stat.color === "amber" && "bg-amber-500 w-12"
                )} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by student, assignment, or class..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={className} onValueChange={setClassName}>
            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="All Classes" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assignmentTitle} onValueChange={setAssignmentTitle}>
            <SelectTrigger className="w-full md:w-[200px] h-12 bg-white border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="All Assignments" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Assignments</SelectItem>
              {assignmentOptions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submissions List */}
      <AnimatePresence mode="wait">
        {fetchState === "loading" ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Fetching submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
              <FolderOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No submissions found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "grid gap-6",
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {filtered.map((r, idx) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                {viewMode === "grid" ? (
                  <div className="group relative bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                          <span className="text-lg font-bold">{r.studentName.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                            {r.studentName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-0 font-bold text-[10px] uppercase tracking-wider">
                        Submitted
                      </Badge>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{r.assignmentTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{r.className || "—"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Files ({r.urls.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {r.urls.map((u, i) => (
                            <div
                              key={u + i}
                              className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group/file"
                              onClick={() => handleView(u)}
                            >
                              {isPdf(u) ? <FileText className="w-3.5 h-3.5 text-rose-500" /> : <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="text-xs font-medium text-slate-600 group-hover/file:text-blue-700">
                                File {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-2xl h-11 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs gap-2"
                        onClick={async () => {
                          for (let i = 0; i < r.urls.length; i++) {
                            await handleDownload(r.urls[i], i, r);
                          }
                        }}
                        disabled={r.urls.length === 0}
                      >
                        <FileDown className="w-4 h-4" />
                        Download All
                      </Button>
                      <Button
                        className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 flex items-center justify-center p-0"
                        onClick={() => handleView(r.urls[0])}
                        disabled={r.urls.length === 0}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group bg-white rounded-3xl border border-slate-100 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {r.studentName.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{r.studentName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="w-3 h-3" />
                        {r.assignmentTitle}
                      </p>
                    </div>

                    <div className="hidden lg:flex flex-col items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class</span>
                      <span className="text-sm font-bold text-slate-700">{r.className || "—"}</span>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleView(r.urls[0])}
                          disabled={r.urls.length === 0}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-xl h-10 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 font-bold text-xs gap-2"
                          onClick={async () => {
                            for (let i = 0; i < r.urls.length; i++) {
                              await handleDownload(r.urls[i], i, r);
                            }
                          }}
                          disabled={r.urls.length === 0}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
