"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/dev/button";
import { getPagesConfig } from "@/lib/site-config";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { useCustomization } from "@/context/CustomizationContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { useMemo } from "react";

export default function LoginForm() {
  const { login, loading } = useAuth();
  const { siteSettings, pagesSettings, subjects, grades } = useCustomization();
  const pagesConfig = useMemo(() => getPagesConfig({ site: siteSettings, pages: pagesSettings, subjects, grades }), [siteSettings, pagesSettings, subjects, grades]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-gray-100 dark:from-background-dark dark:to-gray-900 p-4 sm:p-8">
      <Card className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white dark:bg-neutral-900 md:grid md:grid-cols-2">
        <div className="hidden md:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50/60 border-r border-slate-100">
          <div className="relative w-64 h-64 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <Image
              src={CLAY_ASSETS.authLockShield}
              alt="Secure Authentication Shield"
              fill
              className="object-contain pointer-events-none"
              priority
            />
          </div>
          <div className="text-center mt-4">
            <h3 className="text-base font-bold text-slate-800">Secure Access Gateway</h3>
            <p className="text-xs text-slate-500 mt-1">End-to-end encrypted session for modern learning</p>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-8 md:px-10 md:py-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-8"
            noValidate
          >
            <div className="md:hidden flex justify-center mb-2">
              <div className="relative w-20 h-20">
                <Image src={CLAY_ASSETS.authLockShield} alt="Shield" fill className="object-contain" priority />
              </div>
            </div>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-semibold text-neutral-900 dark:text-white">
                {pagesConfig.auth.login.title}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-neutral-400">
                {pagesConfig.auth.login.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="identifier">{pagesConfig.auth.login.labels.identifier}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={pagesConfig.auth.login.labels.identifier}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{pagesConfig.auth.login.labels.password}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:underline hover:text-blue-700 transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 rounded-md py-2"
                disabled={loading}
              >
                {loading ? pagesConfig.auth.login.labels.submitting : pagesConfig.auth.login.labels.submit}
              </Button>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                {pagesConfig.auth.login.labels.noAccount}{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:underline hover:text-blue-700 transition"
                >
                  {pagesConfig.auth.login.labels.registerLink}
                </Link>
              </div>
            </CardContent>
          </form>
        </div>
      </Card>
    </div>
  );
}
