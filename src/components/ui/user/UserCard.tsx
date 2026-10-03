import { Button } from "@/components/dev/button";
import { Badge } from "@/components/dev/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dev/avatar";
import { Mail, Phone, Pencil, School } from "lucide-react";

export function UserCard({ user, onEdit }: { user: any; onEdit?: () => void }) {
  const initials = (user.full_name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "teacher":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "moderator":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="p-5 border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-xs bg-white flex flex-col justify-between gap-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-10 h-10 rounded-xl border border-slate-200/80 shrink-0">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.full_name} />}
            <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{user.full_name}</h3>
            <Badge
              variant="outline"
              className={`mt-1 rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight border ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role || "student"}
            </Badge>
          </div>
        </div>
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="w-8 h-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0"
            title="Edit User"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
        {user.email && (
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.school && (
          <div className="flex items-center gap-2 text-slate-500 truncate">
            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{user.school}</span>
          </div>
        )}
      </div>
    </div>
  );
}
