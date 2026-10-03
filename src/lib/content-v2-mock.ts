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
import { NavItem } from "./site-config";

export const siteConfig = {
  metadata: content.site.metadata,
  layout: content.site.layout,
  nav: {
    items: (user?: { _id?: string; role?: string }): NavItem[] => [],
    otherItems: (user?: { _id?: string; role?: string }): NavItem[] => []
  },
  footer: {
    ...content.site.footer,
    social: {
      facebook: {
        ...content.site.footer.social.facebook,
        icon: FaFacebook,
      },
      youtube: {
        ...content.site.footer.social.youtube,
        icon: FaYoutube,
      },
      whatsapp: {
        ...content.site.footer.social.whatsapp,
        icon: MessageCircle,
      },
    },
  },
};

export const pagesConfig = {
  about: {
    metadata: content.pages.about.metadata,
    hero: {
      ...content.pages.about.hero,
      actions: [],
    },
    teacher: {
      ...content.pages.about.teacher,
      socials: [],
    },
    results: {
      ...content.pages.about.results,
      icon: Award,
    },
    quote: {
      ...content.pages.about.quote,
      icon: Quote,
    },
    education: {
      ...content.pages.about.education,
      icon: BookOpen,
    },
    features: {
      ...content.pages.about.features,
      icon: FlagIcon,
    },
    stats: {
      ...content.pages.about.stats,
      icon: Award,
      items: [],
    },
  },
  dashboard: {
    metadata: content.pages.dashboard.metadata,
    sections: {
      enrolled: {
        ...content.pages.dashboard.sections.enrolled,
        icon: GraduationCap,
      },
      popular: {
        ...content.pages.dashboard.sections.popular,
        icon: BookOpen,
      },
      quizzes: {
        ...content.pages.dashboard.sections.quizzes,
        icon: ListChecks,
      },
    },
    labels: content.pages.dashboard.labels,
  },
  classes: {
    metadata: content.pages.classes.metadata,
    header: {
      ...content.pages.classes.header,
      icon: BookOpen,
    },
    filters: content.pages.classes.filters,
    labels: content.pages.classes.labels,
  },
  quizzes: {
    metadata: content.pages.quizzes.metadata,
    header: {
      ...content.pages.quizzes.header,
      icon: GraduationCap,
    },
    filters: content.pages.quizzes.filters,
    challenges: {
      ...content.pages.quizzes.challenges,
      icon: Swords,
    },
    all: {
      ...content.pages.quizzes.all,
      icon: ListChecks,
    },
    labels: content.pages.quizzes.labels,
  },
  performance: {
    metadata: content.pages.performance.metadata,
    header: {
      ...content.pages.performance.header,
      icon: Activity,
    },
    sections: content.pages.performance.sections,
  },
  auth: content.pages.auth,
};
