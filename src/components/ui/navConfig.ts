import {
  HiHome,
  HiClipboardDocumentList,
  HiDocumentText,
  HiFolderOpen,
  HiUser,
  HiAcademicCap,
  HiBeaker,
  HiInformationCircle,
  HiBolt,
  HiPlusCircle,
  HiVideoCamera,
  HiClipboardDocumentCheck,
  HiUserPlus,
  HiPresentationChartLine,
  HiBuildingLibrary,
} from 'react-icons/hi2';

import { IconType } from 'react-icons';

export type NavItem = {
  id: string;
  label: string;
  icon: IconType;
  href?: string;
  visibleOn: ('mobile' | 'desktop')[];
  children?: NavItem[];
  /** if set, item is shown only when user.role matches (string or includes). */
  requireRole?: string | string[];
};

type UserLike = { _id?: string; role?: string } | undefined;

export const navItems = (user?: UserLike): NavItem[] => [
  {
    id: 'home',
    label: 'Home',
    icon: HiHome,
    visibleOn: ['mobile', 'desktop'],
    requireRole: 'student',
    href: '/dashboard',
  },
  {
    id: 'homeadmin',
    label: 'Home',
    icon: HiHome,
    visibleOn: ['mobile', 'desktop'],
    requireRole: 'teacher',
    href: '/admin/dashboard',
  },
  // 👉 Quick Action (teachers only)
  {
    id: 'quick-action',
    label: 'Quick Action',
    icon: HiBolt,
    visibleOn: ['desktop'],
    requireRole: 'teacher',
    children: [
      {
        id: 'qa-create-class',
        label: 'Create class',
        icon: HiPlusCircle,
        visibleOn: ['desktop'],
        href: '/admin/classes/add',
      },
      {
        id: 'qa-create-recording',
        label: 'Create recording',
        icon: HiVideoCamera,
        visibleOn: ['desktop'],
        href: '/admin/recording/add',
      },
      {
        id: 'qa-create-quiz',
        label: 'Create quiz',
        icon: HiClipboardDocumentCheck,
        visibleOn: ['desktop'],
        href: '/admin/quizez/add',
      },
      {
        id: 'qa-enroll-students',
        label: 'Enroll students',
        icon: HiUserPlus,
        visibleOn: ['desktop'],
        href: '/admin/classes/applications',
      },
      {
        id: 'qa-download-assignments',
        label: 'Papers Download',
        icon: HiFolderOpen,
        visibleOn: ['desktop'],
        href: '/admin/classes/assignment'
      },
    ],
  },
  {
    id: 'classes',
    label: 'Classes',
    icon: HiBuildingLibrary,
    visibleOn: ['mobile', 'desktop'],
    href: '/classes',
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    icon: HiDocumentText,
    visibleOn: ['mobile', 'desktop'],
    href: '/quizzes',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: HiPresentationChartLine,
    visibleOn: ['mobile', 'desktop'],
    href: '/quizzes/performance',
    requireRole: ['student', 'teacher'],
  },
  {
    id: 'about',
    label: 'About',
    icon: HiInformationCircle,
    visibleOn: ['mobile', 'desktop'],
    href: '/info',
  },
  {
    id: 'user',
    label: 'User',
    icon: HiUser,
    visibleOn: ['mobile'],
    requireRole: 'student',
    href: user?._id ? `/user/${user._id}` : '/user',
  },
  {
    id: 'useradmin',
    label: 'User',
    icon: HiUser,
    visibleOn: ['mobile'],
    requireRole: 'teacher',
    href: '/admin/user',
  },
  {
    id: 'grades',
    label: 'Grades',
    icon: HiAcademicCap,
    visibleOn: ['desktop'],
    children: [
      { id: 'grade-6', label: 'Grade 6', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=6' },
      { id: 'grade-7', label: 'Grade 7', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=7' },
      { id: 'grade-8', label: 'Grade 8', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=8' },
      { id: 'grade-9', label: 'Grade 9', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=9' },
      { id: 'grade-10', label: 'Grade 10', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=10' },
      { id: 'grade-11', label: 'Grade 11', icon: HiAcademicCap, visibleOn: ['desktop'], href: '/classes?grade=11' },
    ],
  },
  {
    id: 'subjects',
    label: 'Subjects',
    icon: HiBeaker,
    visibleOn: ['desktop'],
    children: [
      { id: 'mathematics', label: 'Mathematics', icon: HiBeaker, visibleOn: ['desktop'], href: '/classes?subject=mathematics' },
      { id: 'science', label: 'Science', icon: HiBeaker, visibleOn: ['desktop'], href: '/classes?subject=science' },
    ],
  },
];

export const otherItems = (user?: UserLike): NavItem[] => [

  {
    id: 'user',
    label: 'User',
    icon: HiUser,
    visibleOn: ['desktop'],
    requireRole: 'student',
    href: user?._id ? `/user/${user._id}` : '/user',
  },
  {
    id: 'useradmin',
    label: 'User',
    icon: HiUser,
    visibleOn: ['desktop'],
    requireRole: 'teacher',
    href: '/admin/user',
  },
];
