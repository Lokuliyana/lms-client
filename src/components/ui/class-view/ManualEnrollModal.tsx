"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/dev/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { Button } from "@/components/dev/button";
import { Input } from "@/components/dev/input";
import {
  Search,
  UserPlus,
  Calendar,
  Check,
  CheckCircle2,
  Users,
  Filter,
  Loader2,
  AlertCircle,
  X,
  GraduationCap,
} from "lucide-react";
import { getCandidateStudents, manualEnrollStudents, getClasses } from "@/services/classService";
import { toast } from "sonner";

interface ManualEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
  selectedMonth?: string;
  onSuccess?: () => void;
  availableClasses?: Array<{ _id: string; title: string }>;
}

export function ManualEnrollModal({
  isOpen,
  onClose,
  classId,
  className,
  selectedMonth,
  onSuccess,
  availableClasses,
}: ManualEnrollModalProps) {
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [classList, setClassList] = useState<Array<{ _id: string; title: string }>>(() => {
    if (availableClasses && availableClasses.length > 0) return availableClasses;
    if (classId) return [{ _id: classId, title: className || "Current Class" }];
    return [];
  });
  const [selectedClassId, setSelectedClassId] = useState<string>(classId || "");
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth || currentMonthKey);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [numericValue, setNumericValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Month choices for enrollment
  const monthOptions = useMemo(() => {
    const list = [
      { value: "all", label: "Full / Lifetime Access (All Months)" },
    ];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      list.push({ value: key, label: `${label} (${key})` });
    }
    return list;
  }, []);

  // Sync availableClasses prop if changed
  useEffect(() => {
    if (availableClasses && availableClasses.length > 0) {
      setClassList(availableClasses);
      if (!selectedClassId && availableClasses[0]?._id) {
        setSelectedClassId(availableClasses[0]._id);
      }
    } else if (classId && (!classList || classList.length === 0)) {
      setClassList([{ _id: classId, title: className || "Current Class" }]);
    }
  }, [availableClasses, classId]);

  // Sync initial classId prop if passed
  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId);
    }
  }, [classId]);

  // Sync selectedMonth prop if passed
  useEffect(() => {
    if (selectedMonth) {
      setActiveMonth(selectedMonth);
    }
  }, [selectedMonth]);

  // Fetch classes if none passed
  useEffect(() => {
    if (!isOpen) return;

    if (!availableClasses || availableClasses.length === 0) {
      const fetchAllClasses = async () => {
        try {
          setLoadingClasses(true);
          const res = await getClasses();
          const items = Array.isArray(res) ? res : [];
          const mapped = items.map((c: any) => ({
            _id: String(c._id),
            title: c.title || "Untitled Class",
          }));
          if (classId && !mapped.some((c: any) => c._id === classId)) {
            mapped.unshift({ _id: classId, title: className || "Current Class" });
          }
          setClassList(mapped);
          if (!selectedClassId && mapped.length > 0) {
            setSelectedClassId(mapped[0]._id);
          }
        } catch (err) {
          console.error("Failed to load classes for manual enrollment:", err);
        } finally {
          setLoadingClasses(false);
        }
      };
      fetchAllClasses();
    }
  }, [isOpen, availableClasses, classId, className]);

  // If selectedClassId is set, fetch candidate students
  useEffect(() => {
    if (!isOpen || !selectedClassId) return;
    fetchCandidates();
  }, [isOpen, selectedClassId, numericValue, searchTerm]);

  const fetchCandidates = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (numericValue.trim()) {
        params.ageOrYear = numericValue.trim();
      }

      const list = await getCandidateStudents(selectedClassId, params);
      setCandidates(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error("Failed to load candidates:", err);
      toast.error(err.response?.data?.message || "Failed to search students.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unenrolledCandidates = candidates.filter((c) => !c.isEnrolled);
    if (selectedIds.size === unenrolledCandidates.length && unenrolledCandidates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unenrolledCandidates.map((c) => String(c._id))));
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedClassId) {
      toast.error("Please select a target class first.");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Please select at least one student to grant access.");
      return;
    }

    try {
      setSubmitting(true);
      const ids = Array.from(selectedIds);
      const monthToGrant = activeMonth && activeMonth !== "all" ? activeMonth : undefined;
      const res = await manualEnrollStudents(selectedClassId, ids, monthToGrant);
      toast.success(res.message || `Granted access to ${ids.length} student(s)!`);
      setSelectedIds(new Set());
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error granting student access:", err);
      toast.error(err.response?.data?.message || "Failed to grant student access.");
    } finally {
      setSubmitting(false);
    }
  };

  const unenrolledCount = useMemo(
    () => candidates.filter((c) => !c.isEnrolled).length,
    [candidates]
  );

  const activeClassName = useMemo(() => {
    const found = classList.find((c) => c._id === selectedClassId);
    return found ? found.title : className || "";
  }, [classList, selectedClassId, className]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Grant Student Access & Manual Enrollment
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Select target class, pick enrollment month, filter eligible students, and grant access
                {activeClassName ? ` to ${activeClassName}` : ""}
                {activeMonth && activeMonth !== "all" ? ` for ${activeMonth}` : " (All Months)"}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Target Class & Target Month Selectors */}
        <div className="pt-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Target Class Selector */}
            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Target Class</span>
                </div>
              </div>

              <div>
                {loadingClasses ? (
                  <div className="h-9 px-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Loading classes...</span>
                  </div>
                ) : classList.length === 0 ? (
                  <div className="text-xs text-amber-600 font-medium">No classes found</div>
                ) : (
                  <Select
                    value={selectedClassId}
                    onValueChange={(val) => {
                      setSelectedClassId(val);
                      setSelectedIds(new Set());
                      setCandidates([]);
                    }}
                  >
                    <SelectTrigger className="h-9 bg-white border-slate-200 text-xs font-semibold rounded-xl focus:ring-indigo-500">
                      <SelectValue placeholder="Select target class" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-xl border-slate-200 shadow-xl">
                      {classList.map((c) => (
                        <SelectItem key={c._id} value={c._id} className="text-xs font-medium">
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Target Month Selector */}
            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Access Month</span>
                </div>
              </div>

              <div>
                <Select
                  value={activeMonth}
                  onValueChange={(val) => setActiveMonth(val)}
                >
                  <SelectTrigger className="h-9 bg-white border-slate-200 text-xs font-semibold rounded-xl focus:ring-purple-500">
                    <SelectValue placeholder="Select access month" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl border-slate-200 shadow-xl">
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Controls */}
        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name / Email / Phone Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, or phone..."
                className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Single Birth Year or Age Option */}
            <div className="relative">
              <Filter className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                placeholder="Filter by Birth Year or Age (e.g. 2007 or 18)..."
                className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white"
              />
              {numericValue && (
                <button
                  type="button"
                  onClick={() => setNumericValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span>Checking DOB (birth year) &amp; calculated age automatically</span>
            {(searchTerm || numericValue) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setNumericValue("");
                }}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Students Candidate List */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span>
              Found <strong>{candidates.length}</strong> students ({unenrolledCount} eligible for new access)
            </span>
            {unenrolledCount > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {selectedIds.size === unenrolledCount ? "Deselect All" : "Select All Eligible"}
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs font-medium">Searching students roster...</p>
              </div>
            ) : !selectedClassId ? (
              <div className="p-8 text-center text-slate-400">
                <GraduationCap className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-700">Please select a target class above</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-700">No students matched your criteria</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try adjusting your name search or age/birth year filter.
                </p>
              </div>
            ) : (
              candidates.map((stu) => {
                const sid = String(stu._id);
                const isSelected = selectedIds.has(sid);
                const isEnrolled = stu.isEnrolled;

                return (
                  <div
                    key={sid}
                    onClick={() => {
                      if (!isEnrolled) toggleSelectStudent(sid);
                    }}
                    className={`p-3 flex items-center justify-between gap-3 transition ${
                      isEnrolled
                        ? "bg-slate-50 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50/70 cursor-pointer"
                        : "hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isEnrolled
                            ? "bg-slate-200 border-slate-300 text-slate-500"
                            : isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isEnrolled ? (
                          <Check className="w-3 h-3 text-slate-500" />
                        ) : isSelected ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {stu.full_name || stu.name}
                          </p>
                          {isEnrolled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Already Enrolled
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {stu.email} {stu.phone ? `• ${stu.phone}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {stu.birth_year ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Born {stu.birth_year}
                          </span>
                          {stu.age !== null && (
                            <span className="text-[10px] text-slate-400">
                              {stu.age} yrs old
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No DOB recorded</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleGrantAccess}
            disabled={!selectedClassId || selectedIds.size === 0 || submitting}
            className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-5 h-10 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Granting Access...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Grant Access ({selectedIds.size} Selected)</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ManualEnrollModal;
