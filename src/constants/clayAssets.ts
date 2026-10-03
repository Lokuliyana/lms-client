export const CLAY_ASSETS = {
  bannerStudentSaturn: "/assets/clay/banner-student-saturn.svg",
  bannerAdminStation: "/assets/clay/banner-admin-station.svg",
  bannerModeratorDesk: "/assets/clay/banner-moderator-desk.svg",
  emptyNoClassesToday: "/assets/clay/empty-no-classes-today.svg",
  emptyCatalogSearch: "/assets/clay/empty-catalog-search.svg",
  emptyQuizzesZero: "/assets/clay/empty-quizzes-zero.svg",
  emptyExamResults: "/assets/clay/empty-exam-results.svg",
  emptyAttendanceRoster: "/assets/clay/empty-attendance-roster.svg",
  emptyDeliveriesPack: "/assets/clay/empty-deliveries-pack.svg",
  emptyNotifications: "/assets/clay/empty-notifications.svg",
  thumbTheoryOpenbook: "/assets/clay/thumb-theory-openbook.svg",
  thumbRevisionScreen: "/assets/clay/thumb-revision-screen.svg",
  thumbPaperClass: "/assets/clay/thumb-paper-class.svg",
  thumbIctTech: "/assets/clay/thumb-ict-tech.svg",
  thumbScienceStem: "/assets/clay/thumb-science-stem.svg",
  thumbMathematics: "/assets/clay/thumb-mathematics.svg",
  thumbCommerceAccounts: "/assets/clay/thumb-commerce-accounts.svg",
  storeHeroCart: "/assets/clay/store-hero-cart.svg",
  dispatchCourierVan: "/assets/clay/dispatch-courier-van.svg",
  deliveryInTransit: "/assets/clay/delivery-in-transit.svg",
  deliveryCompleted: "/assets/clay/delivery-completed.svg",
  examPaperCreation: "/assets/clay/exam-paper-creation.svg",
  examMarksSpreadsheet: "/assets/clay/exam-marks-spreadsheet.svg",
  gradeReportTrophy: "/assets/clay/grade-report-trophy.svg",
  liveStageOnair: "/assets/clay/live-stage-onair.svg",
  recordingsCinema: "/assets/clay/recordings-cinema.svg",
  authLockShield: "/assets/clay/auth-lock-shield.svg",
  accessDeniedGate: "/assets/clay/access-denied-gate.svg",
  profileStudentId: "/assets/clay/profile-student-id.svg",
  brandingPaintPalette: "/assets/clay/branding-paint-palette.svg",
} as const;

export type ClayAssetKey = keyof typeof CLAY_ASSETS;

export interface SubjectPastelTheme {
  name: string;
  badge: string;
  capsuleBg: string;
  capsuleBorder: string;
  capsuleText: string;
  glow: string;
  accentGradient: string;
  dotColor: string;
}

function extractSubjectString(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    const val =
      obj.name ||
      obj.title ||
      obj.label ||
      obj.subject ||
      obj.subjectName ||
      obj.value;
    if (typeof val === "string") return val;
    if (val !== undefined && val !== null) return String(val);
    return "";
  }
  try {
    return String(input);
  } catch {
    return "";
  }
}

export function getSubjectPastelTheme(subjectName?: unknown): SubjectPastelTheme {
  let norm = "";
  try {
    norm = extractSubjectString(subjectName).toLowerCase().trim();
  } catch {
    norm = "";
  }

  // Science / STEM
  if (
    norm.includes("science") ||
    norm.includes("physics") ||
    norm.includes("chemistry") ||
    norm.includes("bio") ||
    norm.includes("stem") ||
    norm.includes("විද්‍යාව") ||
    norm.includes("භෞතික") ||
    norm.includes("රසායන") ||
    norm.includes("ජීව")
  ) {
    return {
      name: "science",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      capsuleBg: "bg-emerald-50/90",
      capsuleBorder: "border-emerald-200/70",
      capsuleText: "text-emerald-800",
      glow: "shadow-emerald-500/10",
      accentGradient: "from-emerald-500 to-teal-600",
      dotColor: "bg-emerald-500",
    };
  }

  // Mathematics
  if (
    norm.includes("math") ||
    norm.includes("combined") ||
    norm.includes("calculus") ||
    norm.includes("algebra") ||
    norm.includes("ගණිතය")
  ) {
    return {
      name: "mathematics",
      badge: "bg-blue-50 text-blue-700 border-blue-200/80",
      capsuleBg: "bg-blue-50/90",
      capsuleBorder: "border-blue-200/70",
      capsuleText: "text-blue-800",
      glow: "shadow-blue-500/10",
      accentGradient: "from-blue-500 to-indigo-600",
      dotColor: "bg-blue-500",
    };
  }

  // Tech / ICT
  if (
    norm.includes("ict") ||
    norm.includes("tech") ||
    norm.includes("computer") ||
    norm.includes("code") ||
    norm.includes("information") ||
    norm.includes("තාක්ෂණ") ||
    norm.includes("තොරතුරු") ||
    norm.includes("අයිසීටී")
  ) {
    return {
      name: "tech",
      badge: "bg-purple-50 text-purple-700 border-purple-200/80",
      capsuleBg: "bg-purple-50/90",
      capsuleBorder: "border-purple-200/70",
      capsuleText: "text-purple-800",
      glow: "shadow-purple-500/10",
      accentGradient: "from-purple-500 to-violet-600",
      dotColor: "bg-purple-500",
    };
  }

  // Commerce / Business
  if (
    norm.includes("commerce") ||
    norm.includes("account") ||
    norm.includes("business") ||
    norm.includes("econ") ||
    norm.includes("වාණිජ") ||
    norm.includes("ගිණුම්") ||
    norm.includes("ව්‍යාපාර") ||
    norm.includes("ආර්ථික")
  ) {
    return {
      name: "commerce",
      badge: "bg-amber-50 text-amber-700 border-amber-200/80",
      capsuleBg: "bg-amber-50/90",
      capsuleBorder: "border-amber-200/70",
      capsuleText: "text-amber-800",
      glow: "shadow-amber-500/10",
      accentGradient: "from-amber-500 to-orange-600",
      dotColor: "bg-amber-500",
    };
  }

  // Default / General
  return {
    name: "default",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    capsuleBg: "bg-indigo-50/90",
    capsuleBorder: "border-indigo-200/70",
    capsuleText: "text-indigo-800",
    glow: "shadow-indigo-500/10",
    accentGradient: "from-indigo-500 to-purple-600",
    dotColor: "bg-indigo-500",
  };
}

export function getSubjectThumbnail(subjectName?: unknown, classType?: unknown): string {
  let normSubject = "";
  let normType = "";
  try {
    normSubject = extractSubjectString(subjectName).toLowerCase().trim();
  } catch {
    normSubject = "";
  }
  try {
    normType = extractSubjectString(classType).toLowerCase().trim();
  } catch {
    normType = "";
  }

  // 1. Check subject taxonomy first
  if (
    normSubject.includes("ict") ||
    normSubject.includes("tech") ||
    normSubject.includes("computer") ||
    normSubject.includes("information") ||
    normSubject.includes("තාක්ෂණ") ||
    normSubject.includes("තොරතුරු") ||
    normSubject.includes("අයිසීටී")
  ) {
    return CLAY_ASSETS.thumbIctTech;
  }
  if (
    normSubject.includes("science") ||
    normSubject.includes("physics") ||
    normSubject.includes("chemistry") ||
    normSubject.includes("bio") ||
    normSubject.includes("stem") ||
    normSubject.includes("විද්‍යාව") ||
    normSubject.includes("භෞතික") ||
    normSubject.includes("රසායන") ||
    normSubject.includes("ජීව")
  ) {
    return CLAY_ASSETS.thumbScienceStem;
  }
  if (
    normSubject.includes("math") ||
    normSubject.includes("combined") ||
    normSubject.includes("algebra") ||
    normSubject.includes("calculus") ||
    normSubject.includes("ගණිතය")
  ) {
    return CLAY_ASSETS.thumbMathematics;
  }
  if (
    normSubject.includes("commerce") ||
    normSubject.includes("account") ||
    normSubject.includes("business") ||
    normSubject.includes("econ") ||
    normSubject.includes("වාණිජ") ||
    normSubject.includes("ගිණුම්") ||
    normSubject.includes("ව්‍යාපාර") ||
    normSubject.includes("ආර්ථික")
  ) {
    return CLAY_ASSETS.thumbCommerceAccounts;
  }

  // 2. Check class type taxonomy
  if (normType.includes("paper") || normType.includes("ප්‍රශ්න") || normType.includes("පේපර්")) {
    return CLAY_ASSETS.thumbPaperClass;
  }
  if (normType.includes("revision") || normType.includes("පුනරීක්ෂණ")) {
    return CLAY_ASSETS.thumbRevisionScreen;
  }
  if (normType.includes("theory") || normType.includes("සිද්ධාන්ත")) {
    return CLAY_ASSETS.thumbTheoryOpenbook;
  }

  // 3. Fallback
  return CLAY_ASSETS.thumbTheoryOpenbook;
}
