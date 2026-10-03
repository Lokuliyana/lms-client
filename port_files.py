import os
import shutil

source_base = "/Users/chandupa/tuition-frontend/app"
dest_base = "/Users/chandupa/lms-client/src/app"

files_to_port = [
    "user/[id]/page.tsx",
    "classes/page.tsx",
    "classes/[id]/page.tsx",
    "admin/classes/page.tsx",
    "admin/classes/add/page.tsx",
    "admin/classes/applications/page.tsx",
    "admin/classes/assignment/page.tsx",
    "admin/classes/edit/[id]/page.tsx",
    "admin/classes/edit/[id]/client.tsx",
]

for file_path in files_to_port:
    src = os.path.join(source_base, file_path)
    dst = os.path.join(dest_base, file_path)
    
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    
    with open(src, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if file_path == "user/[id]/page.tsx":
        # Replace useAuth destructuring
        content = content.replace(
            "const { isTeacher, isModerator, user: currentUser } = useAuth();",
            "const { isTeacher, isModerator, user: currentUser, logout } = useAuth();"
        )
        # Replace handleLogout
        old_logout = """  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.clear();
    } finally {
      router.replace("/login");
    }
  };"""
        new_logout = """  const handleLogout = () => {
    logout();
  };"""
        content = content.replace(old_logout, new_logout)
        
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Ported {file_path}")
