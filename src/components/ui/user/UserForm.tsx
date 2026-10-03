"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Button } from "@/components/dev/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { Textarea } from "@/components/dev/textarea";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  Calendar, 
  GraduationCap as GradIcon, 
  ShieldCheck,
  Save,
  KeyRound,
  History,
  BookOpen,
  ShieldAlert,
  UserCheck,
  Key
} from "lucide-react";

type Role = "student" | "teacher" | "moderator" | string;

interface Props {
  initialData: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

function mapToForm(u: any) {
  return {
    full_name: u?.full_name ?? "",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    role: (u?.role as Role) ?? "student",
    school: u?.school ?? "",
    grade: u?.grade ? String(u.grade) : "",
    birth_date: u?.birth_date ? String(u.birth_date).slice(0, 10) : "",
    home_address: u?.home_address ?? "",
    bio: u?.bio ?? "",
    qualifications: u?.qualifications ?? "",
    password: "",
  };
}

function shapePayload(form: any, isNew: boolean) {
  const common: any = {
    full_name: form.full_name?.trim(),
    phone: form.phone?.trim(),
    role: form.role,
  };

  if (isNew) {
    common.email = form.email?.trim();
    common.password = form.password;
  }

  if (form.role === "student") {
    return {
      ...common,
      school: form.school?.trim() || undefined,
      grade: form.grade || undefined,
      birth_date: form.birth_date || undefined,
      home_address: form.home_address?.trim() || undefined,
      bio: undefined,
      qualifications: undefined,
    };
  }

  if (form.role === "teacher" ) {
    return {
      ...common,
      bio: form.bio?.trim() || undefined,
      qualifications: form.qualifications?.trim() || undefined,
      school: undefined,
      grade: undefined,
      birth_date: undefined,
      ol_year: undefined,
      al_year: undefined,
      home_address: undefined,
    };
  }

  return {
    ...common,
    school: undefined,
    grade: undefined,
    birth_date: undefined,
    ol_year: undefined,
    al_year: undefined,
    home_address: undefined,
    bio: undefined,
    qualifications: undefined,
  };
}

export default function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: Props) {
  const { user, isTeacher, isModerator } = useAuth();
  const isAdmin = user?.role === "admin";
  const canUpdate = isAdmin || user?.permissions?.includes("users.update");

  const [submittingReset, setSubmittingReset] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [form, setForm] = useState(mapToForm(initialData));
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  const isNew = !initialData?._id;

  useEffect(() => {
    setForm(mapToForm(initialData));
  }, [initialData]);

  const isStudent = form.role === "student";
  const isTeacherRole = form.role === "teacher" ;
  const isEditingTeacher = initialData?.role === "teacher" ;

  const canResetPassword = !isNew && canUpdate;
  const canChangeRole = canUpdate; 
  const readOnly = !canUpdate;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const payload = useMemo(() => shapePayload(form, isNew), [form, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew && (!form.email || !form.password)) {
      toast({
        title: "Missing fields",
        description: "Email and password are required for new users.",
        variant: "destructive",
      });
      return;
    }
    await onSubmit(payload);
  };

  const handleRoleChangeOnly = async () => {
    if (!canChangeRole || isNew) return;
    try {
      setChangingRole(true);
      await authService.editUser(initialData._id, { role: form.role });
      toast({ title: "Role updated successfully" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Role update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingRole(false);
    }
  };

  const handleResetPassword = async () => {
    if (!canResetPassword || isNew) return;
    if (!adminPassword || adminPassword !== confirmAdminPassword) {
      toast({
        title: "Validation error",
        description: "Passwords must match and cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReset(true);
      await authService.adminResetPassword(initialData._id, {
        newPassword: adminPassword,
        confirmPassword: confirmAdminPassword,
      });
      toast({
        title: "Password reset",
        description: "User password has been updated.",
      });
      setShowResetForm(false);
      setAdminPassword("");
      setConfirmAdminPassword("");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Password reset failed",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <User className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-slate-600 font-semibold text-xs ml-0.5">Full Name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              disabled={readOnly}
              placeholder="Full name"
              className="rounded-lg border-slate-200 h-10 px-3 text-sm focus:ring-0 active:ring-0 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-600 font-semibold text-xs ml-0.5">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="email" 
                value={form.email} 
                onChange={(e) => isNew && handleChange("email", e.target.value)}
                disabled={!isNew || readOnly} 
                placeholder="email@example.com"
                className={`rounded-lg border-slate-200 h-10 pl-9 text-sm transition-all focus:ring-0 active:ring-0 ${!isNew ? 'bg-slate-50 text-slate-500' : ''}`} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-600 font-semibold text-xs ml-0.5">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={readOnly}
                placeholder="07XXXXXXXX"
                className="rounded-lg border-slate-200 h-10 pl-9 text-sm focus:ring-0 active:ring-0 transition-all"
              />
            </div>
          </div>

          {canChangeRole && (
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Access Role</Label>
              <div className="flex gap-2">
                <Select
                  value={form.role}
                  onValueChange={(v) => handleChange("role", v)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="rounded-lg border-slate-200 h-10 px-3 text-sm font-medium text-slate-700 focus:ring-0 active:ring-0 flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                    <SelectItem value="student" className="text-sm cursor-pointer">Student</SelectItem>
                    <SelectItem value="moderator" className="text-sm cursor-pointer">Moderator</SelectItem>
                    <SelectItem value="teacher" className="text-sm cursor-pointer">Teacher</SelectItem>
                  </SelectContent>
                </Select>
                {!isNew && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRoleChangeOnly}
                    disabled={readOnly || changingRole || form.role === initialData.role}
                    className="rounded-lg h-10 px-3 text-xs font-bold transition-all"
                  >
                    {changingRole ? "..." : "Update Role"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {isNew && (
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Set account password"
                  className="rounded-lg border-slate-200 h-10 pl-9 text-sm focus:ring-0 active:ring-0 transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Specific Section */}
      {isStudent && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2">
            <GradIcon className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Academic Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">School Name</Label>
              <Input
                value={form.school}
                onChange={(e) => handleChange("school", e.target.value)}
                disabled={readOnly}
                placeholder="School name"
                className="rounded-lg border-slate-200 h-10 px-3 text-sm focus:ring-0 active:ring-0 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Current Grade</Label>
              <Select
                value={form.grade ?? ""}
                onValueChange={(v) => handleChange("grade", v)}
                disabled={readOnly}
              >
                <SelectTrigger className="rounded-lg border-slate-200 h-10 px-3 text-sm font-medium text-slate-700 focus:ring-0 active:ring-0">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  {["6", "7", "8", "9", "10", "11", "12", "13"].map((g) => (
                    <SelectItem key={g} value={g} className="text-sm cursor-pointer">
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Date of Birth</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
                disabled={readOnly}
                className="rounded-lg border-slate-200 h-10 px-3 text-sm focus:ring-0 active:ring-0 transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Home Address</Label>
              <Textarea
                value={form.home_address}
                onChange={(e) => handleChange("home_address", e.target.value)}
                disabled={readOnly}
                placeholder="Full home address..."
                className="rounded-lg border-slate-200 min-h-[80px] p-3 text-sm focus:ring-0 active:ring-0 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {isTeacherRole && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2">
            <BookOpen className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Professional Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Professional Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                disabled={readOnly}
                placeholder="Short introduction..."
                className="rounded-lg border-slate-200 min-h-[100px] p-3 text-sm focus:ring-0 active:ring-0 transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-600 font-semibold text-xs ml-0.5">Qualifications</Label>
              <Textarea
                value={form.qualifications}
                onChange={(e) => handleChange("qualifications", e.target.value)}
                disabled={readOnly}
                placeholder="Degrees, certifications..."
                className="rounded-lg border-slate-200 min-h-[100px] p-3 text-sm focus:ring-0 active:ring-0 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RESET PASSWORD SECTION */}
      {canResetPassword && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2">
            <Key className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security</h3>
          </div>

          {!showResetForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetForm(true)}
              className="rounded-lg h-9 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
            >
              Reset Password
            </Button>
          ) : (
            <div className="space-y-4 bg-rose-50/30 p-4 rounded-lg border border-rose-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-semibold text-xs ml-0.5">New Password</Label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border-slate-200 h-9 px-3 text-sm focus:ring-0 active:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-semibold text-xs ml-0.5">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-lg border-slate-200 h-9 px-3 text-sm focus:ring-0 active:ring-0 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={submittingReset}
                  className="rounded-lg h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                >
                  {submittingReset ? "Resetting..." : "Confirm Reset"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowResetForm(false);
                    setAdminPassword("");
                    setConfirmAdminPassword("");
                  }}
                  className="rounded-lg h-9 px-4 text-slate-500 text-xs font-bold transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
        <Button
          type="button"
          onClick={() => {
            onCancel?.();
          }}
          variant="ghost"
          className="rounded-lg h-10 px-6 font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-8 font-bold shadow-sm transition-all"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : isNew ? "Create User" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
