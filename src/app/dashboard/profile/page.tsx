"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { getMyEnrolledClasses } from "@/services/classService";
import { authService } from "@/services/authService";
import { useTaxonomy } from "@/context/CustomizationContext";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Button } from "@/components/dev/button";
import { Textarea } from "@/components/dev/textarea";
import { Badge } from "@/components/dev/badge";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { 
  User as UserIcon, 
  BookOpen, 
  Lock, 
  GraduationCap, 
  Camera, 
  Save, 
  CheckCircle2, 
  ArrowRight,
  School,
  Phone,
  Mail,
  Calendar,
  Award
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function StudentProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { grades } = useTaxonomy();

  // Personal Info Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Academic Info Form State
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [olYear, setOlYear] = useState("");
  const [alYear, setAlYear] = useState("");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");

  // Security Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form from authenticated user profile
  useEffect(() => {
    if (user) {
      const parts = (user.full_name || "").trim().split(" ");
      setFirstName(user.first_name || parts[0] || "");
      setLastName(user.last_name || parts.slice(1).join(" ") || "");
      setPhone(user.phone || "");
      setAvatar(user.avatar || "");
      setAvatarPreview(user.avatar || "");

      // Student profile data
      const sp = user.student_profile || user;
      setSchool(sp.school || "");
      setGrade(sp.grade || "");
      setOlYear(sp.ol_year || "");
      setAlYear(sp.al_year || "");
      setBio(sp.bio || "");
      setQualifications(sp.qualifications || "");
    }
  }, [user]);

  // Load enrolled classes
  useEffect(() => {
    getMyEnrolledClasses()
      .then((data) => setClasses(data || []))
      .catch((err) => console.error("Failed to load classes", err))
      .finally(() => setClassesLoading(false));
  }, []);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be under 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
        school: school.trim(),
        grade: grade.trim(),
        ol_year: olYear.trim(),
        al_year: alYear.trim(),
        bio: bio.trim(),
        qualifications: qualifications.trim(),
      });

      // Update cached user in localStorage
      if (res.data && res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Too short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingSecurity(true);
      await authService.changePassword({ oldPassword, newPassword });
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Change Failed",
        description: err.response?.data?.message || "Invalid current password or update failed.",
        variant: "destructive",
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Authentication Required</h2>
        <p className="text-slate-500 mt-2">Please sign in to view and manage your profile.</p>
        <Link href="/login" className="inline-block mt-4">
          <Button>Sign In &rarr;</Button>
        </Link>
      </div>
    );
  }

  const activeGrades = (grades || []).filter((g: any) => g.is_active !== false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb Navigation & Canonical Section Header */}
      <div className="space-y-3">
        <nav className="flex items-center text-xs text-slate-400 font-medium gap-1.5">
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">My Profile</span>
        </nav>

        <SectionHeader
          icon={UserIcon}
          title={
            <div className="flex items-center gap-3">
              <span>My Profile & Identity Hub</span>
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
          description="Manage your platform credentials, personal records, academic qualifications, and account security."
        />
      </div>

      {/* Card 1: Avatar display + upload ring + name + role pill */}
      <CardSection
        title="Identity & Account Details"
        description="Verified student account badge, avatar, and institutional affiliation"
        icon={UserIcon}
      >
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Upload Ring */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-200/90 shadow-sm flex items-center justify-center text-3xl font-bold text-slate-700">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={user.full_name || "User Avatar"}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(user.first_name?.[0] || user.full_name?.[0] || "U").toUpperCase()}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-white text-indigo-600 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition-transform active:scale-95"
                title="Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>

            {/* Name + Role Pill + Email */}
            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {user.full_name || `${firstName} ${lastName}`.trim() || "My Profile"}
                </h2>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  {user.role || "Student"}
                </Badge>
              </div>

              <p className="text-slate-500 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {school && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <School className="w-3 h-3 text-slate-500" /> {school}
                  </span>
                )}
                {grade && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3 text-slate-500" /> Grade {grade}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clay 3D Student ID Mascot Graphic */}
          <div className="hidden sm:flex shrink-0 items-center justify-center relative w-20 h-20 drop-shadow-md self-center">
            <Image
              src={CLAY_ASSETS.profileStudentId}
              alt="Student ID Badge"
              fill
              className="object-contain pointer-events-none select-none"
              priority
            />
          </div>
        </div>
      </CardSection>

      {/* Profile Form: Card 2 (Personal) & Card 3 (Academic) */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Card 2: Personal Information */}
        <CardSection
          title="Personal Information"
          description="Update your basic contact and identity details"
          icon={UserIcon}
        >
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="First name"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Last name"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Read-only)</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="rounded-xl border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>
          </div>
        </CardSection>

        {/* Card 3: Academic Bio & Qualifications */}
        <CardSection
          title="Academic Bio & Qualifications"
          description="Educational background, grade levels, examination milestones, and learning goals"
          icon={GraduationCap}
        >
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="school">School / Institution</Label>
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Visakha Vidyalaya, Royal College"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade" className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="Select current grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {activeGrades.map((g: any) => {
                      const gradeVal = (g.name || "").replace(/^grade\s*/i, "").trim() || g.name;
                      return (
                        <SelectItem key={g._id || g.name} value={gradeVal}>
                          {g.name.toLowerCase().startsWith("grade") ? g.name : `Grade ${g.name}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="olYear">O/L Examination Year</Label>
                <Input
                  id="olYear"
                  value={olYear}
                  onChange={(e) => setOlYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alYear">A/L Examination Year</Label>
                <Input
                  id="alYear"
                  value={alYear}
                  onChange={(e) => setAlYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="qualifications">Qualifications / Academic Background</Label>
                <Input
                  id="qualifications"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. 9 A's in O/L, District Rank 5"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="bio">Personal Biography / Learning Goals</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about your academic goals, interests, or career aspirations..."
                  className="rounded-xl border-slate-200 min-h-[100px] p-3 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </CardSection>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={savingProfile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving Profile Changes..." : "Save Profile Changes"}
          </Button>
        </div>
      </form>

      {/* Card 4: Security & Password */}
      <CardSection
        title="Security & Password Management"
        description="Ensure your account uses a secure password of at least 6 characters"
        icon={Lock}
      >
        <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-6 max-w-2xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="rounded-xl border-slate-200 h-10 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password (min. 6 characters)"
                className="rounded-xl border-slate-200 h-10 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-type new password"
                className="rounded-xl border-slate-200 h-10 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              disabled={savingSecurity}
              className="rounded-xl text-xs font-semibold h-10 px-5 gap-2"
            >
              <Lock className="w-4 h-4" />
              {savingSecurity ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </CardSection>

      {/* Card 5: Enrolled Course Roster */}
      <CardSection
        title="Enrolled Classes"
        description={`Your enrolled course roster (${classes.length})`}
        icon={BookOpen}
      >
        <div className="p-4 sm:p-6 space-y-4">
          {classesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-800">No Enrolled Classes Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Explore our catalog to find theory and revision classes taught by top instructors.
              </p>
              <Link href="/classes" className="inline-block mt-2">
                <Button variant="outline">Browse All Classes</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {cls.class_code || "Class"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{cls.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{cls.description || "No description provided."}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">
                      {cls.hasAccessThisMonth ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Access Active
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Subscription Pending</span>
                      )}
                    </span>
                    <Link
                      href={`/classes/${cls._id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Class Hub <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardSection>
    </div>
  );
}
