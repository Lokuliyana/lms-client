"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Button } from "@/components/dev/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/dev/select";
import { Textarea } from "@/components/dev/textarea";
import { Card } from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import { Avatar, AvatarFallback } from "@/components/dev/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  Calendar, 
  GraduationCap as GradIcon, 
  LogOut, 
  Save, 
  ShieldCheck,
  ArrowLeft,
  BookOpen,
  Sparkles,
  ChevronRight,
  KeyRound,
  Key
} from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Role = "student" | "teacher" | "moderator" | string;

function mapUserToForm(user: any) {
  const role: Role = user?.role || "";
  const base = {
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  };

  if (role === "student") {
    return {
      role,
      form: {
        ...base,
        school: user?.school || "",
        grade: user?.grade || "",
        birth_date: user?.birth_date
          ? String(user.birth_date).slice(0, 10)
          : "",
        ol_year: user?.ol_year ? String(user.ol_year) : "",
        al_year: user?.al_year ? String(user.al_year) : "",
        bio: "",
        qualifications: "",
      },
    };
  }

  if (role === "teacher" ) {
    return {
      role,
      form: {
        ...base,
        bio: user?.bio || "",
        qualifications: user?.qualifications || "",
        school: "",
        grade: "",
        birth_date: "",
        ol_year: "",
        al_year: "",
      },
    };
  }

  return {
    role,
    form: {
      ...base,
      school: "",
      grade: "",
      birth_date: "",
      ol_year: "",
      al_year: "",
      bio: "",
      qualifications: "",
    },
  };
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { isTeacher, isModerator, user: currentUser, logout } = useAuth();
  const canResetPassword = isTeacher || isModerator;
  const isOwnProfile = currentUser?._id === userId;

  const [loadingUser, setLoadingUser] = useState(true);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [userRole, setUserRole] = useState<Role>("");
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [form, setForm] = useState<any>({
    full_name: "",
    email: "",
    phone: "",
    school: "",
    grade: "",
    birth_date: "",
    ol_year: "",
    al_year: "",
    bio: "",
    qualifications: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [adminResetForm, setAdminResetForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingUser(true);
        const res: any = await authService.getUserById(userId);
        const u = res?.data?.user ?? res?.data ?? res;

        if (!u || typeof u !== "object")
          throw new Error("Invalid user payload");

        const mapped = mapUserToForm(u);
        if (!cancelled) {
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
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleRoleChange = async (roleId: string) => {
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

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminResetForm.newPassword !== adminResetForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReset(true);
      await authService.adminResetPassword(userId, {
        newPassword: adminResetForm.newPassword,
        confirmPassword: adminResetForm.confirmPassword,
      });
      toast({
        title: "Success",
        description: "Password has been reset successfully",
      });
      setAdminResetForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reset password.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReset(true);
      await authService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  const payload = useMemo(() => {
    const common = {
      full_name: form.full_name?.trim(),
      phone: form.phone?.trim(),
    };

    if (userRole === "student") {
      return {
        ...common,
        school: form.school?.trim() || undefined,
        grade: form.grade || undefined,
        birth_date: form.birth_date || undefined,
        ol_year: form.ol_year ? Number(form.ol_year) : undefined,
        al_year: form.al_year ? Number(form.al_year) : undefined,
      };
    }

    if (userRole === "teacher") {
      return {
        ...common,
        bio: form.bio?.trim() || undefined,
        qualifications: form.qualifications?.trim() || undefined,
      };
    }

    return common;
  }, [form, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.editUser(userId, payload);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Preparing your profile...</p>
        </motion.div>
      </div>
    );
  }

  const initials = form.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb Navigation & Canonical Section Header */}
        <div className="space-y-3">
          <nav className="flex items-center text-xs text-slate-400 font-medium gap-1.5">
            <Link href="/admin/user" className="hover:text-indigo-600 transition-colors">
              User Management
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">{form.full_name || "User Profile"}</span>
          </nav>

          <SectionHeader
            icon={User}
            title={
              <div className="flex items-center gap-3">
                <span>{form.full_name || "User Profile"}</span>
                <div className="relative w-8 h-8 hidden sm:block shrink-0">
                  <Image
                    src={CLAY_ASSETS.profileStudentId}
                    alt="Student ID"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            }
            description={`Account credentials, educational profile, and access permissions for ${form.email || "user"}.`}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="rounded-xl text-xs gap-1.5 h-9"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="rounded-xl text-xs gap-1.5 h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </Button>
                )}
              </div>
            }
          />
        </div>

        {/* Card 1: Avatar display + upload ring + name + role pill */}
        <CardSection
          title="Identity & Role Governance"
          description="Verified account details, access level, and role governance"
          icon={User}
        >
          <div className="p-4 sm:p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-200/90 shadow-xs shrink-0">
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-indigo-50 text-indigo-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {form.full_name || "User Profile"}
                  </h2>
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    {userRole}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {form.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {form.phone}
                  </span>
                </div>

                {/* Role Switcher if Admin */}
                {!isOwnProfile && canResetPassword && availableRoles.length > 0 && (
                  <div className="pt-2 flex items-center gap-2.5">
                    <Label className="text-xs font-bold text-slate-600">Assigned Role:</Label>
                    <Select
                      value={selectedRoleId}
                      onValueChange={handleRoleChange}
                      disabled={updatingRole}
                    >
                      <SelectTrigger className="w-44 rounded-xl border-slate-200 h-9 text-xs font-semibold">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        {availableRoles.map((r) => (
                          <SelectItem key={r._id} value={r._id} className="text-xs">
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex shrink-0 relative w-20 h-20 self-center">
              <Image
                src={CLAY_ASSETS.profileStudentId}
                alt="Student ID Badge"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </CardSection>

        {/* Form Container for Personal and Academic Info */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 2: Personal Information Form */}
          <CardSection
            title="Personal Information"
            description="Update primary name, contact phone number, and account details"
            icon={User}
          >
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-xs">Full Name</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    required
                    className="rounded-xl border-slate-200 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-xs">Email Address (Read-only)</Label>
                  <Input
                    type="email"
                    value={form.email}
                    disabled
                    className="rounded-xl border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-xs">Phone Number</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                    className="rounded-xl border-slate-200 h-11"
                  />
                </div>
              </div>
            </div>
          </CardSection>

          {/* Card 3: Academic Bio & Qualifications */}
          <CardSection
            title="Academic Bio & Qualifications"
            description="Educational background, grade level, and curriculum achievements"
            icon={GradIcon}
          >
            <div className="p-4 sm:p-6">
              {userRole === "student" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">School / Institution</Label>
                    <Input
                      value={form.school}
                      onChange={(e) => handleChange("school", e.target.value)}
                      placeholder="School name"
                      className="rounded-xl border-slate-200 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Current Grade</Label>
                    <Select
                      value={form.grade ?? ""}
                      onValueChange={(v) => handleChange("grade", v)}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {["6", "7", "8", "9", "10", "11", "12", "13"].map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">
                            Grade {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Date of Birth</Label>
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => handleChange("birth_date", e.target.value)}
                      className="rounded-xl border-slate-200 h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-xs">O/L Year</Label>
                      <Input
                        type="number"
                        value={form.ol_year}
                        onChange={(e) => handleChange("ol_year", e.target.value)}
                        className="rounded-xl border-slate-200 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-xs">A/L Year</Label>
                      <Input
                        type="number"
                        value={form.al_year}
                        onChange={(e) => handleChange("al_year", e.target.value)}
                        className="rounded-xl border-slate-200 h-11"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Professional Bio</Label>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Professional overview..."
                      className="rounded-xl border-slate-200 min-h-[100px] p-3 text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Academic Qualifications</Label>
                    <Textarea
                      value={form.qualifications}
                      onChange={(e) => handleChange("qualifications", e.target.value)}
                      placeholder="Degrees, certifications, and awards..."
                      className="rounded-xl border-slate-200 min-h-[100px] p-3 text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardSection>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </Button>
          </div>
        </form>

        {/* Card 4: Security & Password Change */}
        <CardSection
          title="Security & Password Management"
          description="Update account password or perform administrative reset"
          icon={KeyRound}
        >
          <div className="p-4 sm:p-6">
            {isOwnProfile ? (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">New Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Confirm Password</Label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submittingReset}
                    className="rounded-xl text-xs font-semibold h-10 px-5"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            ) : canResetPassword ? (
              <form onSubmit={handleAdminResetPassword} className="space-y-4 max-w-2xl">
                <p className="text-xs text-slate-500 font-medium">
                  Administrative password reset for account #{userId.slice(-6)}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">New Password</Label>
                    <Input
                      type="password"
                      value={adminResetForm.newPassword}
                      onChange={(e) => setAdminResetForm({ ...adminResetForm, newPassword: e.target.value })}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold text-xs">Confirm Password</Label>
                    <Input
                      type="password"
                      value={adminResetForm.confirmPassword}
                      onChange={(e) => setAdminResetForm({ ...adminResetForm, confirmPassword: e.target.value })}
                      className="rounded-xl border-slate-200 h-10 text-xs"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submittingReset}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-5"
                  >
                    Reset User Password
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500">Security actions are restricted for this account.</p>
            )}
          </div>
        </CardSection>
      </div>
    </div>
  );
}
