export default function HomePage() {
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-[0_2px_4px_-1px_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_10px_24px_-3px_rgba(15,23,42,0.05)] hover:border-slate-300/80 transition-all duration-200 ease-out">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800 tracking-tight">Welcome</h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">Dashboard</span>
      </div>
      <div>
        <p className="text-slate-600">The LMS Engine is initialized. Please use the sidebar to navigate through the modules.</p>
      </div>
    </div>
  );
}