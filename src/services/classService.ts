
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getMyEnrolledClasses,
  getAllClassesWithStudents,
  getEnrolledStudents,
  revokeStudentAccess,
  getCandidateStudents,
  manualEnrollStudents,
} from "./class/classCrudService";

export * from "./class/classCrudService";
export * from "./class/applicationService";
export * from "./class/entitlementService";
export * from "./class/zoomTicketService";

export const fetchClasses = getClasses;
export const fetchClassById = getClassById;

export const classService = {
  createClass,
  getClasses,
  fetchClasses: getClasses,
  getClassById,
  fetchClassById: getClassById,
  updateClass,
  deleteClass,
  getMyEnrolledClasses,
  getAllClassesWithStudents,
  getEnrolledStudents,
  revokeStudentAccess,
  getCandidateStudents,
  manualEnrollStudents,
};

export default classService;


