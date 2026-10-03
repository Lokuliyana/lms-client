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
    <div className="space-y-6 sm:space-y-7">
      <ClassForm onSubmit={handleCreate} submitLabel="Create Class" />
    </div>
  );
}
