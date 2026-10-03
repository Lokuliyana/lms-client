"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClassById, updateClass } from "@/services/classService";
import ClassForm from "@/components/ui/class-view/ClassForm";

interface Props {
  classId: string;
}

export default function EditClassClient({ classId }: Props) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const data = await getClassById(classId);
        setInitialData(data);
      } catch (err) {
        console.error("Failed to fetch class:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  const handleUpdate = async (data: any) => {
    try {
      await updateClass(classId, data);
      alert("Class updated successfully!");
      router.push("/admin/classes");
    } catch (error) {
      console.error("Failed to update class:", error);
      alert("Something went wrong.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-44 w-full bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-56 w-full bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }
  if (!initialData) return <div className="p-4 text-red-500 font-medium">Class not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ClassForm
          initialData={initialData}
          onSubmit={handleUpdate}
          submitLabel="Update Class"
        />
      </div>
    </div>
  );
}
