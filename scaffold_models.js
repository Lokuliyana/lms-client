const fs = require('fs');
const path = require('path');

const contracts = `export interface Role {
  id: string;
  name: string;
}
export interface Permission {
  id: string;
  action: string;
}
export interface UserRoleAssignment {
  userId: string;
  roleId: string;
}
export interface Class {
  id: string;
  name: string;
}
export interface Assignment {
  id: string;
  title: string;
}
export interface Quiz {
  id: string;
  title: string;
}
`;
fs.writeFileSync(path.join(__dirname, 'src/services/contracts/models.ts'), contracts);
console.log("Models generated");
