import {
  Award,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  FlagIcon,
  FlaskConical,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Info,
  Library,
  LineChart,
  Mail,
  MessageCircle,
  Play,
  PlusCircle,
  Quote,
  Star,
  User,
  UserPlus,
  Users,
  Video,
  Zap,
  ListChecks,
  Swords,
  LayoutDashboard,
  Settings,
  Activity,
} from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import content from "./content-v2.json";

export type NavItem = {
  id: string;
  label: string;
  icon: any;
  href?: string;
  visibleOn: ("mobile" | "desktop")[];
  children?: NavItem[];
  requireRole?: string | string[];
  configKey?: string;
};

export const getSiteConfig = (settings: any) => ({
  metadata: settings?.site?.metadata || content.site.metadata,
  layout: settings?.site?.layout || content.site.layout,
  nav: {
    items: (user?: { _id?: string; role?: string }): NavItem[] => [
      {
        id: "dashboard",
        label: settings?.site?.nav?.dashboard || content.site.nav.dashboard,
        configKey: "site.nav.dashboard",
        icon: LayoutDashboard,
        visibleOn: ["mobile", "desktop"],
        href: "/dashboard",
      },
      {
        id: "admin",
        label: settings?.site?.nav?.admin || content.site.nav.admin,
        configKey: "site.nav.admin",
        icon: Settings,
        visibleOn: ["desktop"],
        requireRole: ["teacher", "admin"],
        href: "/admin/dashboard",
      },
      // 👉 Quick Action (teachers only)
      {
        id: "quick-action",
        label: settings?.site?.nav?.quickAction || content.site.nav.quickAction,
        configKey: "site.nav.quickAction",
        icon: Zap,
        visibleOn: ["desktop"],
        requireRole: ["teacher", "admin"],
        children: [
          {
            id: "qa-create-class",
            label: settings?.site?.nav?.createClass || content.site.nav.createClass,
            configKey: "site.nav.createClass",
            icon: PlusCircle,
            visibleOn: ["desktop"],
            href: "/admin/classes/add",
          },
          {
            id: "qa-create-recording",
            label: settings?.site?.nav?.createRecording || content.site.nav.createRecording,
            configKey: "site.nav.createRecording",
            icon: Video,
            visibleOn: ["desktop"],
            href: "/admin/recording/add",
          },
          {
            id: "qa-create-quiz",
            label: settings?.site?.nav?.createQuiz || content.site.nav.createQuiz,
            configKey: "site.nav.createQuiz",
            icon: ClipboardCheck,
            visibleOn: ["desktop"],
            href: "/admin/quizzes/add",
          },
          {
            id: "qa-enroll-students",
            label: settings?.site?.nav?.enrollStudents || content.site.nav.enrollStudents,
            configKey: "site.nav.enrollStudents",
            icon: UserPlus,
            visibleOn: ["desktop"],
            href: "/admin/classes/applications",
          },
          {
            id: "qa-download-assignments",
            label: settings?.site?.nav?.papers || content.site.nav.papers,
            configKey: "site.nav.papers",
            icon: FolderOpen,
            visibleOn: ["desktop"],
            href: "/admin/classes/assignment",
          },
        ],
      },
      {
        id: "classes",
        label: settings?.site?.nav?.classes || content.site.nav.classes,
        configKey: "site.nav.classes",
        icon: Library,
        visibleOn: ["mobile", "desktop"],
        href: "/classes",
      },
      {
        id: "quizzes",
        label: settings?.site?.nav?.quizzes || content.site.nav.quizzes,
        configKey: "site.nav.quizzes",
        icon: FileText,
        visibleOn: ["mobile", "desktop"],
        href: "/quizzes",
      },
      {
        id: "performance",
        label: settings?.site?.nav?.performance || content.site.nav.performance,
        configKey: "site.nav.performance",
        icon: LineChart,
        visibleOn: ["mobile", "desktop"],
        href: "/quizzes/performance",
        requireRole: "student",
      },
      {
        id: "about",
        label: settings?.site?.nav?.about || content.site.nav.about,
        configKey: "site.nav.about",
        icon: Info,
        visibleOn: ["mobile", "desktop"],
        href: "/info",
      },
      {
        id: "user",
        label: settings?.site?.nav?.user || content.site.nav.user,
        configKey: "site.nav.user",
        icon: User,
        visibleOn: ["mobile"],
        requireRole: "student",
        href: user?._id ? `/user/${user._id}` : "/user",
      },
      {
        id: "useradmin",
        label: settings?.site?.nav?.user || content.site.nav.user,
        configKey: "site.nav.user",
        icon: User,
        visibleOn: ["mobile"],
        requireRole: ["teacher", "admin"],
        href: "/admin/user",
      },
      {
        id: "grades",
        label: settings?.site?.nav?.grades || content.site.nav.grades,
        configKey: "site.nav.grades",
        icon: GraduationCap,
        visibleOn: ["desktop"],
        children: (settings?.grades || []).map((g: any) => ({
            id: `grade-${g._id}`,
            label: g.name,
            icon: GraduationCap,
            visibleOn: ["desktop"],
            href: `/classes?grade=${g._id}`,
        })),
      },
      {
        id: "subjects",
        label: "Subjects",
        icon: FlaskConical,
        visibleOn: ["desktop"],
        children: (settings?.subjects || []).map((s: any) => ({
            id: `subject-${s._id}`,
            label: s.name,
            icon: FlaskConical,
            visibleOn: ["desktop"],
            href: `/classes?subject=${s._id}`,
        })),
      },
    ],
    otherItems: (user?: { _id?: string; role?: string }): NavItem[] => [
      {
        id: "user",
        label: "User",
        icon: User,
        visibleOn: ["desktop"],
        requireRole: "student",
        href: user?._id ? `/user/${user._id}` : "/user",
      },
      {
        id: "useradmin",
        label: "User",
        icon: User,
        visibleOn: ["desktop"],
        requireRole: ["teacher", "admin"],
        href: "/admin/user",
      },
    ],
  },
  footer: {
    ...(settings?.site?.footer || content.site.footer),
    social: {
      facebook: {
        ...(settings?.site?.footer?.social?.facebook || content.site.footer.social.facebook),
        icon: FaFacebook,
      },
      youtube: {
        ...(settings?.site?.footer?.social?.youtube || content.site.footer.social.youtube),
        icon: FaYoutube,
      },
      whatsapp: {
        ...(settings?.site?.footer?.social?.whatsapp || content.site.footer.social.whatsapp),
        icon: MessageCircle,
      },
    },
  },
});

export const getPagesConfig = (settings: any) => ({
  about: {
    metadata: settings?.pages?.about?.metadata || content.pages.about.metadata,
    hero: {
      ...content.pages.about.hero,
      ...settings?.pages?.about?.hero,
      actions: [
        {
          label: "Watch on YouTube",
          icon: Play,
          href: "https://youtube.com/@mr.mathsscience?si=Cu79QMaZlRZx6bX3",
          primary: true,
        },
        {
          label: "Join a class",
          icon: CalendarCheck2,
          href: "/classes",
          primary: false,
        },
      ],
    },
    teacher: {
      ...content.pages.about.teacher,
      ...settings?.pages?.about?.teacher,
      socials: [
        {
          name: "YouTube",
          url: "https://youtube.com/@mr.mathsscience?si=Cu79QMaZlRZx6bX3",
          icon: Play,
        },
        {
          name: "Facebook",
          url: "https://web.facebook.com/nexvolearn",
          icon: Globe,
        },
        {
          name: "Email",
          url: "mailto:info@mrmathsscience.lk",
          icon: Mail,
        },
      ],
    },
    results: {
      ...(settings?.pages?.about?.results || content.pages.about.results),
      icon: Award,
    },
    quote: {
      ...(settings?.pages?.about?.quote || content.pages.about.quote),
      icon: Quote,
    },
    education: {
      ...(settings?.pages?.about?.education || content.pages.about.education),
      icon: BookOpen,
    },
    features: {
      ...(settings?.pages?.about?.features || content.pages.about.features),
      icon: FlagIcon,
    },
    stats: {
      ...(settings?.pages?.about?.stats || content.pages.about.stats),
      icon: Award,
      items: [
        {
          icon: BookOpen,
          ...((settings?.pages?.about?.stats?.items || content.pages.about.stats.items)[0] || {}),
        },
        {
          icon: Users,
          ...((settings?.pages?.about?.stats?.items || content.pages.about.stats.items)[1] || {}),
        },
        {
          icon: BookOpen,
          ...((settings?.pages?.about?.stats?.items || content.pages.about.stats.items)[2] || {}),
        },
        {
          icon: Star,
          ...((settings?.pages?.about?.stats?.items || content.pages.about.stats.items)[3] || {}),
        },
      ],
    },
  },
  dashboard: {
    metadata: settings?.pages?.dashboard?.metadata || content.pages.dashboard.metadata,
    sections: {
      enrolled: {
        ...(settings?.pages?.dashboard?.sections?.enrolled || content.pages.dashboard.sections.enrolled),
        icon: GraduationCap,
      },
      popular: {
        ...(settings?.pages?.dashboard?.sections?.popular || content.pages.dashboard.sections.popular),
        icon: BookOpen,
      },
      quizzes: {
        ...(settings?.pages?.dashboard?.sections?.quizzes || content.pages.dashboard.sections.quizzes),
        icon: ListChecks,
      },
    },
    labels: settings?.pages?.dashboard?.labels || content.pages.dashboard.labels,
  },
  classes: {
    metadata: settings?.pages?.classes?.metadata || content.pages.classes.metadata,
    header: {
      ...(settings?.pages?.classes?.header || content.pages.classes.header),
      icon: BookOpen,
    },
    filters: settings?.pages?.classes?.filters || content.pages.classes.filters,
    labels: settings?.pages?.classes?.labels || content.pages.classes.labels,
  },
  quizzes: {
    metadata: settings?.pages?.quizzes?.metadata || content.pages.quizzes.metadata,
    header: {
      ...(settings?.pages?.quizzes?.header || content.pages.quizzes.header),
      icon: GraduationCap,
    },
    filters: settings?.pages?.quizzes?.filters || content.pages.quizzes.filters,
    challenges: {
      ...(settings?.pages?.quizzes?.challenges || content.pages.quizzes.challenges),
      icon: Swords,
    },
    all: {
      ...(settings?.pages?.quizzes?.all || content.pages.quizzes.all),
      icon: ListChecks,
    },
    labels: settings?.pages?.quizzes?.labels || content.pages.quizzes.labels,
  },
  performance: {
    metadata: settings?.pages?.performance?.metadata || content.pages.performance.metadata,
    header: {
      ...(settings?.pages?.performance?.header || content.pages.performance.header),
      icon: Activity,
    },
    sections: settings?.pages?.performance?.sections || content.pages.performance.sections,
  },
  auth: {
    ...content.pages.auth,
    ...settings?.pages?.auth,
    login: {
      ...content.pages.auth.login,
      ...settings?.pages?.auth?.login,
    },
    register: {
      ...content.pages.auth.register,
      ...settings?.pages?.auth?.register,
    }
  },
});

export const siteConfig = getSiteConfig({});
export const pagesConfig = getPagesConfig({});
