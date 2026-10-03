const fs = require('fs');
let code = fs.readFileSync('src/app/user/[id]/page.tsx', 'utf8');

// Inject states for roles
code = code.replace(
  `  const [userRole, setUserRole] = useState<Role>("");`,
  `  const [userRole, setUserRole] = useState<Role>("");
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);`
);

// Inject logic to fetch roles
code = code.replace(
  `        if (!cancelled) {
          setUserRole(mapped.role);
          setForm(mapped.form);
        }`,
  `        if (!cancelled) {
          setUserRole(mapped.role);
          setForm(mapped.form);
          if (u.role_ids && u.role_ids.length > 0) {
            setSelectedRoleId(u.role_ids[0]);
          }
        }
        // Also fetch roles if not own profile and can edit
        if (!isOwnProfile && canResetPassword && !cancelled) {
          try {
            const rolesRes = await authService.getRoles();
            setAvailableRoles(rolesRes.data?.data || []);
          } catch (e) { console.error("Failed to fetch roles", e); }
        }`
);

// Inject role update function
code = code.replace(
  `  const handleAdminResetPassword = async (e: React.FormEvent) => {`,
  `  const handleRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId);
    try {
      setUpdatingRole(true);
      await authService.updateUserRole(userId, [roleId]);
      toast({ title: "Success", description: "User role updated successfully" });
      const updatedRoleObj = availableRoles.find(r => r._id === roleId);
      if (updatedRoleObj) setUserRole(updatedRoleObj.name.toLowerCase());
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {`
);

// Inject UI for role change in sidebar
code = code.replace(
  `            {/* Admin Reset Password Section (Sidebar) */}`,
  `            {/* Admin Role Management (Sidebar) */}
            {!isOwnProfile && canResetPassword && availableRoles.length > 0 && (
              <Card className="p-8 border-0 shadow-2xl shadow-indigo-100/50 bg-white rounded-[2.5rem] mt-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Role Management</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">Select User Role</Label>
                    <Select
                      value={selectedRoleId}
                      onValueChange={handleRoleChange}
                      disabled={updatingRole}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                        {availableRoles.map(r => (
                          <SelectItem key={r._id} value={r._id} className="rounded-lg py-2">
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}

            {/* Admin Reset Password Section (Sidebar) */}`
);

fs.writeFileSync('src/app/user/[id]/page.tsx', code);
