import EditClassClient from "./client";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditClassClient classId={id} />;
}
