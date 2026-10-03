// lib/cloudinary.ts
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const DEFAULT_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "";

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/** Upload any file (image/pdf) to Cloudinary and return secure_url */
export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Missing Cloudinary env vars (CLOUD_NAME / UPLOAD_PRESET).");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("tags", "class,education");
  if (folder || DEFAULT_FOLDER) formData.append("folder", folder || DEFAULT_FOLDER);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
  if (!res.ok) {
    let msg = "Cloudinary upload failed";
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
      console.error("Cloudinary upload error:", err);
    } catch {}
    throw new Error(msg);
  }

  const data = (await res.json()) as { secure_url: string };
  if (!data.secure_url || data.secure_url.startsWith("data:")) {
    throw new Error("Invalid Cloudinary response");
  }
  return data.secure_url;
}
