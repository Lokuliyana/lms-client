import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_ORIGIN || "http://127.0.0.1:4002/api"}/auth/profile`, {
      headers: { Cookie: `token=${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await getUserSession();

  if (session && session.data) {
    const role = session.data.role || "";
    const isTeacher = role === "teacher" || role === "admin";
    if (isTeacher) {
      redirect("/admin/dashboard");
    }
  }

  redirect("/dashboard");
}
