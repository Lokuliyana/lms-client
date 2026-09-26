export default function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10 shadow-sm">
      <div className="text-sm font-medium text-slate-500">Home / Dashboard</div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
      </div>
    </header>
  );
}