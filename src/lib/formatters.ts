// src/lib/formatters.ts

/**
 * Checks if a string looks like a 24-character hexadecimal MongoDB ObjectId.
 */
export function isMongoObjectId(val: unknown): boolean {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

/**
 * Formats a grade into a clean, human-readable label: "Grade 6", "Grade 10", "Grade 12", etc.
 * Avoids printing raw Mongo ObjectIds.
 */
export function formatGradeName(
  grade: any,
  gradesList: { _id?: string; name: string }[] = []
): string {
  if (!grade) return "General";

  // If grade is populated object { _id, name }
  if (typeof grade === "object" && grade !== null) {
    if (grade.name) return formatGradeName(grade.name, gradesList);
    if (grade._id) return formatGradeName(grade._id, gradesList);
  }

  const str = String(grade).trim();

  // If it's a 24-char hex ObjectId, look up in gradesList
  if (isMongoObjectId(str)) {
    const found = gradesList.find(
      (g) => g._id?.toString() === str || (g as any).id === str
    );
    if (found && found.name) {
      return formatGradeName(found.name, gradesList);
    }
    return "Grade";
  }

  // If already starts with "Grade"
  if (/^grade\s+/i.test(str)) {
    const numPart = str.replace(/^grade\s+/i, "").trim();
    return `Grade ${numPart}`;
  }

  // If it's a number like "6", "10", "12"
  if (/^\d+$/.test(str)) {
    return `Grade ${str}`;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extracts a normalized raw grade key for comparison (e.g., "10", "12", "6").
 */
export function normalizeGradeKey(grade: any, gradesList: any[] = []): string {
  if (!grade) return "";
  const label = formatGradeName(grade, gradesList);
  return label.replace(/^Grade\s*/i, "").trim().toLowerCase();
}

/**
 * Formats a subject into a clean, human-readable label: "Math", "Science", etc.
 * Avoids printing raw Mongo ObjectIds.
 */
export function formatSubjectName(
  subject: any,
  subjectsList: { _id?: string; name: string }[] = []
): string {
  if (!subject) return "General";

  // If populated object { _id, name }
  if (typeof subject === "object" && subject !== null) {
    if (subject.name) return formatSubjectName(subject.name, subjectsList);
    if (subject._id) return formatSubjectName(subject._id, subjectsList);
  }

  const str = String(subject).trim();

  // If it's a 24-char hex ObjectId, look up in subjectsList
  if (isMongoObjectId(str)) {
    const found = subjectsList.find(
      (s) => s._id?.toString() === str || (s as any).id === str
    );
    if (found && found.name) {
      return formatSubjectName(found.name, subjectsList);
    }
    return "Subject";
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}
