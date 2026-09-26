import Link from 'next/link';
export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 p-4 shadow-sm">
      <div className="text-xl font-bold mb-8 text-slate-800">LMS System</div>
      <nav className="flex flex-col gap-2 text-sm text-slate-600 font-medium">
        <Link href="/" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Dashboard</Link>
        <Link href="/classes" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Classes</Link>
        <Link href="/quizzes" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Quizzes</Link>
      </nav>
    </div>
  );
}