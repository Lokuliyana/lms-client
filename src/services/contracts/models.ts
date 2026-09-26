export interface Role {
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
