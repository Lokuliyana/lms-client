import { HiAcademicCap, HiClock, HiDocumentText, HiPlay } from "react-icons/hi2";
import { motion } from "framer-motion";
import Link from "next/link";

export interface QuizDto {
  _id: string;
  class_id: string;
  title: string;
  is_active: boolean;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  subject: string;
  time_limit_sec: number;
  question_count: number;
  version: number;
}

interface ClassQuizzesProps {
  quizzes: QuizDto[];
}

function formatTime(sec: number): string {
  if (!sec) return "No Limit";
  const m = Math.floor(sec / 60);
  return `${m} min`;
}

export function ClassQuizzes({ quizzes }: ClassQuizzesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {quizzes.map((q, idx) => (
        <motion.div
          key={q._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
        >
          {/* Decorative gradient header */}
          <div className={`h-2 w-full ${q.is_active ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" : "bg-slate-200"}`} />

          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <HiDocumentText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                   q.is_active 
                     ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                     : "bg-slate-100 text-slate-500 border-slate-200"
                 }`}>
                   {q.is_active ? "Active" : "Closed"}
                 </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
              {q.title}
            </h3>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {q.subject}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                q.difficulty === 'Hard' ? 'bg-red-50 text-red-700 border-red-100' :
                q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-green-50 text-green-700 border-green-100'
              }`}>
                {q.difficulty}
              </span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500 py-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <HiAcademicCap className="w-4 h-4 text-slate-400" />
                  <span>{q.question_count} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiClock className="w-4 h-4 text-slate-400" />
                  <span>{formatTime(q.time_limit_sec)}</span>
                </div>
              </div>

              <Link href={q.is_active ? `/quizzes/${q._id}` : "#"} className="block">
                <button
                  disabled={!q.is_active}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    q.is_active
                      ? "bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-600/30 active:scale-[0.98]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {q.is_active ? (
                    <>
                      Start Quiz <HiPlay className="w-4 h-4" />
                    </>
                  ) : (
                    "Not Available"
                  )}
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
