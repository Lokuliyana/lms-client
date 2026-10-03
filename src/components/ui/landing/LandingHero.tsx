export default function LandingHero() {
  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
        The Future of Learning
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
        Join our platform to access world-class courses, interactive quizzes, and challenges.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <a href="/login" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          Get started
        </a>
      </div>
    </div>
  );
}
