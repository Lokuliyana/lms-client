"use client";

import { useRouter } from "next/navigation";
import { createClass } from "@/services/classService";
import ClassForm from "@/components/ui/class-view/ClassForm";

export default function AddClassPage() {
  const router = useRouter();

  const handleCreate = async (data: any) => {
    await createClass(data);
    alert("Class created successfully!");
    router.push("/admin/classes");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ClassForm onSubmit={handleCreate} submitLabel="Create Class" />
      </div>
    </div>
  );
}
