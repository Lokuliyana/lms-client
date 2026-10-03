"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClassCard } from "@/components/reusable/classCard";
import { getClasses, getMyEnrolledClasses } from "@/services/classService";
import { SectionHeader } from "@/components/reusable/section-header";
import { ChevronDown, CheckCircle, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";
import { Button } from "@/components/dev/button";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import Head from "next/head";
import { useAuth } from "@/hooks/useAuth";
import { siteConfig, pagesConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";
import { useCustomization } from "@/context/CustomizationContext";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import { CLAY_ASSETS } from "@/constants/clayAssets";

type ClassData = {
  _id: string;
  title: string;
  description?: string;
  subject: any;
  grade: any;
  image?: string;
  price?: number;
  batches?: any[];
  labels?: any[];
  classTime?: any[];
  classFee?: any;
};

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
}: {
  label: ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        className="h-9 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white/80"
      >
        {label}: {options.find((opt) => opt.value === value)?.label || value}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-48">
      {options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function ClassesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const isStaff = isTeacher;
  const [mounted, setMounted] = useState(false);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [enrolledStatusMap, setEnrolledStatusMap] = useState<Record<string, { isEnrolled: boolean; hasAccessThisMonth: boolean }>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");

  useEffect(() => {
    setSubjectFilter(searchParams.get("subject") || "all");
    setGradeFilter(searchParams.get("grade") || "all");
    setEnrollmentFilter(searchParams.get("view") || "all");
  }, [searchParams]);

  const updateParams = (subject: string, grade: string, view: string) => {
    const newParams = new URLSearchParams();
    if (subject !== "all") newParams.set("subject", subject);
    if (grade !== "all") newParams.set("grade", grade);
    if (view !== "all") newParams.set("view", view);

    router.push(`/classes?${newParams.toString()}`, { scroll: false });
  };

  const handleSubjectChange = (value: string) => {
    updateParams(value, gradeFilter, enrollmentFilter);
  };

  const handleGradeChange = (value: string) => {
    updateParams(subjectFilter, value, enrollmentFilter);
  };

  const handleEnrollmentFilterChange = (value: string) => {
    updateParams(subjectFilter, gradeFilter, value);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(data || []);
      } catch (err) {
        setError("Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!user) return;
      try {
        const enrolled = await getMyEnrolledClasses();
        if (Array.isArray(enrolled)) {
          const map: Record<string, { isEnrolled: boolean; hasAccessThisMonth: boolean }> = {};
          enrolled.forEach((c: any) => {
            map[c._id] = { isEnrolled: true, hasAccessThisMonth: c.hasAccessThisMonth };
          });
          setEnrolledStatusMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch enrolled classes", e);
      }
    };
    fetchEnrolled();
  }, [user]);

  const { grades, subjects } = useCustomization();

  const quickGradeOptions = useMemo(() => {
    const activeGrades = (grades || []).filter((g: any) => g.is_active !== false);
    const sorted = [...activeGrades].sort((a: any, b: any) => {
      const numA = typeof a.level === "number" ? a.level : parseInt((a.name || "").replace(/\D/g, ""), 10) || 0;
      const numB = typeof b.level === "number" ? b.level : parseInt((b.name || "").replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
    return [
      { value: "all", label: "All Classes" },
      ...sorted.map((g: any) => {
        const clean = (g.name || "").replace(/^grade\s*/i, "").trim() || g.name;
        return {
          value: clean,
          label: g.name.toLowerCase().startsWith("grade") ? g.name : `Grade ${g.name}`,
        };
      }),
    ];
  }, [grades]);

  const allSubjects = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => {
      const label = formatSubjectName(c.subject, subjects);
      if (label && label !== "Subject") {
        map.set(label.toLowerCase(), label);
      }
    });
    subjects.forEach((s) => {
      if (s.name) {
        map.set(s.name.toLowerCase(), s.name);
      }
    });
    return [
      { value: "all", label: pagesConfig.classes.filters.subject.all },
      ...Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [classes, subjects]);

  const allGrades = useMemo(() => {
    return [
      { value: "all", label: pagesConfig.classes.filters.grade.all },
      ...quickGradeOptions.filter((o) => o.value !== "all"),
    ];
  }, [quickGradeOptions]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const cGradeName = formatGradeName(c.grade, grades);
      const cSubjName = formatSubjectName(c.subject, subjects);

      let matchGrade = true;
      if (gradeFilter !== "all") {
        const cleanFilter = gradeFilter.replace(/^grade\s*/i, "").trim().toLowerCase();
        const cleanClassGrade = cGradeName.replace(/^grade\s*/i, "").trim().toLowerCase();
        const rawGradeId = typeof c.grade === "object" ? c.grade?._id?.toString() : String(c.grade || "");
        matchGrade =
          cleanClassGrade === cleanFilter ||
          cGradeName.toLowerCase() === gradeFilter.toLowerCase() ||
          rawGradeId === gradeFilter;
      }

      let matchSubject = true;
      if (subjectFilter !== "all") {
        const filterLow = subjectFilter.toLowerCase();
        const subjLow = cSubjName.toLowerCase();
        const rawSubjId = typeof c.subject === "object" ? c.subject?._id?.toString() : String(c.subject || "");
        matchSubject =
          subjLow === filterLow ||
          subjLow.includes(filterLow) ||
          filterLow.includes(subjLow) ||
          rawSubjId === subjectFilter;
      }

      let matchEnrollment = true;
      if (enrollmentFilter === "enrolled") {
        matchEnrollment = !!enrolledStatusMap[c._id]?.isEnrolled;
      }

      return matchGrade && matchSubject && matchEnrollment;
    });
  }, [classes, subjectFilter, gradeFilter, enrollmentFilter, enrolledStatusMap, grades, subjects]);

  const groupedByGrade: Record<string, ClassData[]> = useMemo(() => {
    const groups: Record<string, ClassData[]> = {};
    for (const c of filteredClasses) {
      const gradeLabel = formatGradeName(c.grade, grades);
      if (!groups[gradeLabel]) groups[gradeLabel] = [];
      groups[gradeLabel].push(c);
    }
    return groups;
  }, [filteredClasses, grades]);

  if (loading) return <SectionLoader />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>{pagesConfig.classes.metadata.title}</title>
        <meta name="description" content={pagesConfig.classes.metadata.description} />
        <meta name="keywords" content={pagesConfig.classes.metadata.keywords.join(", ")} />
        <link rel="canonical" href={pagesConfig.classes.metadata.url} />
        <meta property="og:title" content={pagesConfig.classes.metadata.title} />
        <meta property="og:description" content={pagesConfig.classes.metadata.description} />
        <meta property="og:url" content={pagesConfig.classes.metadata.url} />
        <meta property="og:site_name" content={siteConfig.layout.organization.name} />
      </Head>
      <div className="space-y-6 sm:space-y-7">
        <SectionHeader
          title={
            <EditableContent
              configKey="pages.classes.header.title"
              initialValue={pagesConfig.classes.header.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.classes.header.description"
              initialValue={pagesConfig.classes.header.description}
            />
          }
          icon={pagesConfig.classes.header.icon}
          actions={
            isStaff ? (
              <Button
                onClick={() => router.push("/admin/classes/add")}
                className="h-9 px-4 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Class
              </Button>
            ) : undefined
          }
        />

        <CatalogFilterBar
          viewFilter={enrollmentFilter}
          onViewFilterChange={user ? handleEnrollmentFilterChange : undefined}
          viewOptions={
            user
              ? [
                  { value: "all", label: pagesConfig.classes.filters.view.all },
                  { value: "enrolled", label: pagesConfig.classes.filters.view.enrolled },
                ]
              : undefined
          }
          viewLabel={
            <EditableContent
              configKey="pages.classes.filters.view.label"
              initialValue={pagesConfig.classes.filters.view.label}
            />
          }
          subjectFilter={subjectFilter}
          onSubjectFilterChange={handleSubjectChange}
          subjectOptions={allSubjects}
          subjectLabel={
            <EditableContent
              configKey="pages.classes.filters.subject.label"
              initialValue={pagesConfig.classes.filters.subject.label}
            />
          }
          gradeFilter={gradeFilter}
          onGradeFilterChange={handleGradeChange}
          gradeOptions={allGrades}
          gradeLabel={
            <EditableContent
              configKey="pages.classes.filters.grade.label"
              initialValue={pagesConfig.classes.filters.grade.label}
            />
          }
          quickGradeOptions={quickGradeOptions}
          onClearAll={() => updateParams("all", "all", "all")}
          sheetTitle="Filter Classes"
        />

        {/* Classes Sections grouped by grade */}
        {Object.entries(groupedByGrade).map(([gradeLabel, classList]) => (
          <section key={gradeLabel} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-4.5 rounded-full bg-primary" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {gradeLabel.startsWith("Grade") ? `${gradeLabel} Classes` : `Grade ${gradeLabel} Classes`}
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-full">
                  {classList.length} {classList.length === 1 ? "class" : "classes"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {classList.map((classItem: any) => (
                <ClassCard
                  id={classItem._id}
                  classId={classItem.classId}
                  key={classItem._id}
                  image={classItem.image || "/images/placeholder.jpg"}
                  title={classItem.title}
                  description={classItem.description}
                  labels={classItem.labels}
                  grade={classItem.grade}
                  subject={classItem.subject}
                  classTime={classItem.classTime}
                  classFee={classItem.classFee}
                  href={`/classes/${classItem._id}`}
                  ctaLabel={
                    <EditableContent
                      configKey="pages.classes.labels.joinClass"
                      initialValue={pagesConfig.classes.labels.joinClass}
                    />
                  }
                  isEnrolled={!!enrolledStatusMap[classItem._id]?.isEnrolled}
                  hasAccessThisMonth={!!enrolledStatusMap[classItem._id]?.hasAccessThisMonth}
                  teacher={classItem.teacher}
                />
              ))}
            </div>
          </section>
        ))}
        
        {filteredClasses.length === 0 && (
          <ClayEmptyState
            illustration={CLAY_ASSETS.emptyCatalogSearch}
            title={pagesConfig.classes.labels.noClassesFound}
            description={pagesConfig.classes.labels.adjustFilters}
            action={
              (gradeFilter !== "all" || subjectFilter !== "all" || enrollmentFilter !== "all")
                ? {
                    label: "Clear All Filters",
                    onClick: () => updateParams("all", "all", "all"),
                    variant: "outline",
                  }
                : undefined
            }
            secondaryAction={
              enrollmentFilter === "enrolled"
                ? {
                    label: pagesConfig.classes.labels.viewAllClasses,
                    onClick: () => handleEnrollmentFilterChange("all"),
                  }
                : undefined
            }
          />
        )}
      </div>
    </>
  );
}
