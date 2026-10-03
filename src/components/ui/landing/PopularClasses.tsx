export default async function PopularClasses() {
  // In a real app, this would fetch from the backend
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Popular Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="h-40 bg-slate-100 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-lg">Example Class {i}</h3>
            <p className="text-sm text-slate-500 mt-2">Learn the fundamentals of this exciting subject.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
