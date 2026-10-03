"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ClassClientPage from "@/components/ui/class-view/class-page";
import { getClassById } from "@/services/classService";
import { DetailLoader } from "@/components/reusable/detail-loader";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [classData, setClassData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined") return;
    (async () => {
      try {
        const data = await getClassById(id);
        if (!data) {
          router.replace("/404");
          return;
        }
        setClassData(data);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) return <DetailLoader />;
  if (fetchError) return <div>Error fetching class.</div>;
  if (!classData) return null;

  return <ClassClientPage classData={classData} />;
}
