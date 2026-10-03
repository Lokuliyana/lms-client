// components/ui/class-view/class-page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { ClassHeader } from "@/components/ui/class-view/class-header";
import { ClassSidebar } from "@/components/ui/class-view/class-sidebar";
import { ClassTabs } from "@/components/ui/class-view/class-tabs";
import { authService } from "@/services/authService";
import { getClassById } from "@/services/classService";

export default function ClassClientPage({ classData }: { classData: any }) {
  const [updatedData, setUpdatedData] = useState(classData);

  useEffect(() => {
    const user = authService.getStoredUser();
    const isTeacher = (user?.role === "teacher" || user?.role === "admin") ;
    const isEnrolled = classData?.enrolledUsers?.includes(user?._id);
    classData.isPaid = isTeacher || isEnrolled;
    setUpdatedData({ ...classData });
  }, [classData]);

  const refetch = useCallback(async () => {
    try {
      const fresh = await getClassById(updatedData._id);
      if (fresh) setUpdatedData(fresh);
    } catch (e) {
      console.error("Refetch failed", e);
    }
  }, [updatedData?._id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ClassHeader classData={updatedData} />
            <ClassTabs classData={updatedData} />
          </div>
          <div className="lg:col-span-1">
            <ClassSidebar classData={updatedData} onRefetch={refetch} />
          </div>
        </div>
      </div>
    </div>
  );
}
