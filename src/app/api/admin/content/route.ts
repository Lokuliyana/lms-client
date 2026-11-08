import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const contentPath = path.join(process.cwd(), "src", "lib", "content-v2.json");
    const targetFile = fs.existsSync(contentPath)
      ? contentPath
      : path.join(process.cwd(), "lib", "content-v2.json");

    if (fs.existsSync(targetFile)) {
      const fileContent = fs.readFileSync(targetFile, "utf-8");
      const content = JSON.parse(fileContent);

      // Helper to set nested value by key path (e.g., "person.hero.heading")
      const keys = key.split(".");
      let current = content;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      fs.writeFileSync(targetFile, JSON.stringify(content, null, 2));

      // Also sync to backend Express API so MongoDB SiteSettings matches
      try {
        const origin = process.env.API_ORIGIN || "http://localhost:4002/api";
        const backendBase = origin.replace(/\/api\/?$/, "");
        await fetch(`${backendBase}/api/admin/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
      } catch {
        // Non-blocking fallback if backend is offline during local compilation
      }

      return NextResponse.json({ success: true, content });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
