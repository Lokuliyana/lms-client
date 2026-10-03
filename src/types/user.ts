export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'moderator' | 'admin';
  roles?: string[];
  permissions: string[];
  avatar?: string;
  is_verified: boolean;
}

export interface StudentProfile {
  user_id: string;
  full_name: string;
  school?: string;
  grade?: string;
  avatar_url?: string;
}
