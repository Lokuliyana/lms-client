const fs = require('fs');
const content = fs.readFileSync('src/services/classService.ts', 'utf-8');

const crudExports = ['createClass', 'getClasses', 'getClassById', 'updateClass', 'deleteClass', 'getAllClassesWithStudents', 'getMyEnrolledClasses'];
const appExports = ['applyForClass', 'handleApplication', 'giveAccessToAll', 'getApplications'];
const entExports = ['grantMonthlyEntitlement', 'bulkGrantMonthToUsers', 'listMyMonthKeys', 'listUserMonthKeys', 'userCanAccessMonth'];
const zoomExports = ['createMeetingTicket'];

// A very naive split: just dump everything into each file, but it might not be tree-shakable if they all import everything.
// Actually, I can just copy the whole file into each, and then delete the non-relevant exports.
// For now, let's just make the files and we'll fix the exports in classService.ts.

fs.writeFileSync('src/services/class/classCrudService.ts', content);
fs.writeFileSync('src/services/class/applicationService.ts', content);
fs.writeFileSync('src/services/class/entitlementService.ts', content);
fs.writeFileSync('src/services/class/zoomTicketService.ts', content);

const indexContent = `
export * from "./class/classCrudService";
export * from "./class/applicationService";
export * from "./class/entitlementService";
export * from "./class/zoomTicketService";
`;
fs.writeFileSync('src/services/classService.ts', indexContent);
