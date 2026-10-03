"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { Button } from "@/components/dev/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/dev/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/dev/select";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Textarea } from "@/components/dev/textarea";
import { Card } from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import { Avatar, AvatarFallback } from "@/components/dev/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { authService } from "@/services/authService";
import UserForm from "@/components/ui/user/UserForm";
import { UserCard } from "@/components/ui/user/UserCard";
import { 
  PencilIcon, 
  PlusCircle, 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  School,
  LogOut,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Settings2,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dev/table";

const roles = ["all", "student", "moderator", "teacher"];

type CreateModeratorPayload = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  permitted_class_ids?: string[];
};

export default function AdminUsersPage() {
  const { user, isTeacher, isModerator } = useAuth();
  const isAdmin = user?.role === "admin";
  const canManageUsers = isAdmin || user?.permissions?.includes("users.create") || user?.permissions?.includes("users.update");

  const [users, setUsers] = useState<any[]>([]); 
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // create/edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevFilterRef = useRef({ search: debouncedSearch, role: roleFilter });
  const currentRequestIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++currentRequestIdRef.current;
    setIsLoading(true);
    try {
      const res = await authService.getAllUsers({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      if (requestId !== currentRequestIdRef.current) return;

      const data = res?.data ?? res;
      const userList = Array.isArray(data)
        ? data
        : (data?.users || data?.data || []);
      setUsers(userList);
      const totalCount = typeof data?.total === "number" ? data.total : userList.length;
      setTotal(totalCount);
      setTotalPages(typeof data?.totalPages === "number" ? data.totalPages : Math.max(1, Math.ceil(totalCount / limit)));
    } catch (err) {
      if (requestId !== currentRequestIdRef.current) return;
      console.error("Failed to fetch users", err);
      toast({
        title: "Failed to load users",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, limit, debouncedSearch, roleFilter]);

  useEffect(() => {
    if (
      prevFilterRef.current.search !== debouncedSearch ||
      prevFilterRef.current.role !== roleFilter
    ) {
      prevFilterRef.current = { search: debouncedSearch, role: roleFilter };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchUsers();
  }, [page, debouncedSearch, roleFilter, fetchUsers]);

  const filteredUsers = users;

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (selectedUser) {
        await authService.editUser(selectedUser._id, data);
        toast({ title: "User updated successfully" });
      } else {
        // Use a generic create user endpoint for all roles
        await authService.createUser(data);
        toast({ title: "User created successfully" });
        setPage(1);
      }
      setFormOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (e: any) {
      console.error(e);
      toast({
        title: selectedUser ? "Update failed" : "Creation failed",
        description: e?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "teacher": return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case "moderator": return <UserCheck className="w-4 h-4 text-amber-600" />;
      default: return <GraduationCap className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "teacher": return "bg-rose-100 text-rose-700 border-rose-200";
      case "moderator": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Breadcrumb & Section Header */}
        <div className="space-y-3">
          <nav className="flex items-center text-xs text-slate-400 font-medium gap-1.5">
            <span className="hover:text-indigo-600 transition-colors">Admin</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">User Management</span>
          </nav>

          <SectionHeader
            icon={Users}
            title={
              <div className="flex items-center gap-3">
                <span>User Directory & Identity Hub</span>
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
            description="Manage platform users, roles, account records, and administrative access permissions."
            actions={
              <div className="flex items-center gap-2">
                {canManageUsers && (
                  <Button 
                    onClick={() => {
                      setSelectedUser(null);
                      setFormOpen(true);
                    }} 
                    className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all gap-2 text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-10 px-4 border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-all"
                  onClick={async () => {
                    try {
                      await authService.logout();
                    } catch (err) {
                      console.error("Logout failed", err);
                    } finally {
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("user");
                        window.location.href = "/login";
                      }
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            }
          />
        </div>

        <CardSection
          title="User Roster"
          description={`Registered accounts: ${total} total users`}
          icon={Users}
        >
          <div className="p-4 sm:p-6 space-y-6">
            {/* Filters & Controls */}
        <Card className="p-2 border border-slate-200 shadow-sm bg-white rounded-xl flex flex-col md:flex-row gap-2 items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {isLoading || searchQuery !== debouncedSearch ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <Input 
              placeholder="Search by name, email, or phone..." 
              className="pl-10 rounded-lg border-slate-100 focus:border-indigo-500 focus:ring-0 h-10 w-full bg-slate-50/50 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 px-2 h-10 bg-slate-50/50 rounded-lg border border-slate-100">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[130px] border-0 bg-transparent focus:ring-0 h-8 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {roles.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize text-sm">
                      {r === "all" ? "All Roles" : r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex p-1 bg-slate-50/50 rounded-lg border border-slate-100 h-10">
              <button 
                onClick={() => setViewMode("list")}
                className={`px-3 rounded-md transition-all flex items-center ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 rounded-md transition-all flex items-center ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Users Display */}
        <AnimatePresence mode="wait">
          {isLoading && filteredUsers.length === 0 ? (
            <motion.div
              key="loading-roster"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-4"
            >
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Loading user roster...</p>
            </motion.div>
          ) : filteredUsers.length > 0 ? (
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {viewMode === "list" ? (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-[300px] pl-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User Details</TableHead>
                        <TableHead className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</TableHead>
                        <TableHead className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution/Grade</TableHead>
                        <TableHead className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</TableHead>
                        <TableHead className="pr-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow 
                          key={user._id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 rounded-lg border border-slate-200">
                                <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                                  {user.full_name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">#{user._id.slice(-6)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            <div className="flex flex-col gap-0.5 font-medium">
                              <span className="flex items-center gap-1.5 text-slate-900">{user.school || "—"}</span>
                              {user.grade && <span className="text-xs text-slate-400">Grade {user.grade}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0 rounded-md hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setFormOpen(true);
                              }}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user._id}
                      user={user}
                      onEdit={() => {
                        setSelectedUser(user);
                        setFormOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Bar */}
              {total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 text-sm text-slate-500 border-t border-slate-200/60 mt-4">
                  <div>
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                      {(page - 1) * limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-800">
                      {Math.min(page * limit, total)}
                    </span>{" "}
                    of <span className="font-semibold text-slate-800">{total}</span> users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs font-semibold rounded-lg border-slate-200"
                      disabled={page <= 1 || isLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs">
                      Page {page} of {Math.max(1, totalPages)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs font-semibold rounded-lg border-slate-200"
                      disabled={page >= totalPages || isLoading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300">
                <Search className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">No results found</h3>
                <p className="text-slate-500 font-medium">We couldn't find any users matching your criteria.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(""); setRoleFilter("all"); setPage(1); }} 
                className="h-12 px-8 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
              >
                Clear all filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </CardSection>
    </div>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            setFormOpen(false);
            setTimeout(() => setSelectedUser(null), 300);
          }
        }}
      >
        <DialogContent className="p-0 max-w-2xl max-h-[95vh] overflow-hidden rounded-xl border border-slate-200 shadow-2xl bg-white flex flex-col">
          <DialogHeader className="px-6 py-6 border-b border-slate-100 flex-none">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Settings2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedUser ? "Edit User Profile" : "Add New User"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium text-sm">
              {selectedUser 
                ? `Modify account details and access permissions for ${selectedUser?.full_name}.`
                : "Create a new student, teacher, or moderator account."}
            </DialogDescription>
          </DialogHeader>

          <VisuallyHidden.Root>
            <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
          </VisuallyHidden.Root>

          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
            <UserForm
              key={selectedUser?._id || "new-user"}
              initialData={selectedUser}
              onSubmit={handleSubmit}
              onCancel={() => {
                setFormOpen(false);
                setSelectedUser(null);
              }}
              isLoading={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
