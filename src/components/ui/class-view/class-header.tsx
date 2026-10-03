import Image from "next/image";
import {
  HiAcademicCap,
  HiUserGroup,
  HiClock,
  HiCalendar,
} from "react-icons/hi2";
import { Badge } from "@/components/dev/badge";
import { format } from "date-fns";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { CLAY_ASSETS, getSubjectThumbnail } from "@/constants/clayAssets";

interface ClassHeaderProps {
  classData: any;
  image?: string;
}

function calculateDuration(start: string, end: string): string {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startDate = new Date(0, 0, 0, startHour, startMinute);
  const endDate = new Date(0, 0, 0, endHour, endMinute);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${diffHours}h ${diffMinutes > 0 ? diffMinutes + "m" : ""}`;
}

export function ClassHeader({ classData }: ClassHeaderProps) {
  const fallbackThumb = getSubjectThumbnail(classData?.subject, classData?.type);
  const resolvedImageSrc =
    classData.image?.startsWith("http") || classData.image?.startsWith("/")
      ? classData.image
      : classData.image
      ? `${
          process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
          (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/uploads` : "http://localhost:4002/uploads")
        }/${classData.image}`
      : fallbackThumb || "/placeholder.jpg";

  const duration =
    classData.batches?.[0]?.start && classData.batches[0]?.end
      ? calculateDuration(classData.batches[0].start, classData.batches[0].end)
      : "TBA";

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="relative h-64 sm:h-80">
        <Image
          src={resolvedImageSrc}
          alt={classData.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* On-Air / Live Stage Pill */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
            <Image
              src={CLAY_ASSETS.liveStageOnair}
              alt="Live Stage"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
            <span>{classData.format === "ONLINE" ? "Live Interactive" : "Virtual Campus"}</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {classData.grade && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                <HiAcademicCap className="w-4 h-4 mr-1" />
                {formatGradeName(classData.grade)}
              </Badge>
            )}
            {classData.subject && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {formatSubjectName(classData.subject)}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {classData.title}
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-gray-600 text-lg leading-relaxed">
          {classData.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-xs">
              <HiClock className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</p>
            <p className="font-semibold text-slate-900 mt-0.5 text-sm">{duration}</p>
          </div>
          <div className="text-center p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-xs">
              <HiUserGroup className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Batches</p>
            <p className="font-semibold text-slate-900 mt-0.5 text-sm">
              {classData.batches?.length || 0}
            </p>
          </div>
          <div className="text-center p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-xs">
              <HiAcademicCap className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Format</p>
            <p className="font-semibold text-slate-900 mt-0.5 text-sm uppercase">
              {classData.format || "-"}
            </p>
          </div>
          <div className="text-center p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-xs">
              <HiCalendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Class Type</p>
            <p className="font-semibold text-slate-900 mt-0.5 text-sm uppercase">
              {classData.type || "REGULAR"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
