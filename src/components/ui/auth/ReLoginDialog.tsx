"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/dev/dialog";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Button } from "@/components/dev/button";
import { subscribeToLoginDialog, closeLoginDialog } from "@/lib/authState";
import { toast } from "@/hooks/use-toast";
import { pagesConfig } from "@/lib/site-config";

export default function ReLoginDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { login, loading } = useAuth();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeToLoginDialog((open) => {
      setIsOpen(open);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Use a custom login logic that doesn't necessarily redirect if we just want to re-auth
      // But useAuth.login redirects. We might need a "silent" login or just handle it.
      // For simplicity, let's assume if they login successfully, we close the dialog.
      // The redirect in useAuth.login will still happen, which is usually fine 
      // (it will just reload the dashboard or stay if already there).
      await login(identifier, password);
      toast({
        title: "Session Restored",
        description: "You have successfully logged back in.",
      });
      closeLoginDialog();
      setIdentifier("");
      setPassword("");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeLoginDialog()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-0 shadow-2xl p-8">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-lg">
            Your session has ended or you don't have permission. Please log in again to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}
          
          <div className="space-y-2.5">
            <Label htmlFor="re-identifier" className="text-slate-800 font-bold ml-1 text-sm">
              {pagesConfig.auth.login.labels.identifier}
            </Label>
            <Input
              id="re-identifier"
              type="text"
              placeholder="Email or Phone"
              className="rounded-2xl border-slate-200 h-14 px-5 font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="re-password" className="text-slate-800 font-bold ml-1 text-sm">
              Password
            </Label>
            <Input
              id="re-password"
              type="password"
              placeholder="••••••••"
              className="rounded-2xl border-slate-200 h-14 px-5 font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <p className="text-center text-sm text-slate-400 font-medium">
            Don't want to log in? <button type="button" onClick={() => window.location.href = "/login"} className="text-indigo-600 font-bold hover:underline">Go to Login Page</button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
