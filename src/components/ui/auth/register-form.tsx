"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { authService } from "@/services/authService";
import { Button } from "@/components/dev/button";
import { getPagesConfig } from "@/lib/site-config";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { useCustomization } from "@/context/CustomizationContext";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";
import { Separator } from "@/components/dev/separator";

export default function RegisterForm() {
  const { siteSettings, pagesSettings, subjects, grades } = useCustomization();
  const pagesConfig = useMemo(() => getPagesConfig({ site: siteSettings, pages: pagesSettings, subjects, grades }), [siteSettings, pagesSettings, subjects, grades]);

  const [currentStep, setCurrentStep] = useState(0);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [resendCountdown, setResendCountdown] = useState(0);

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    birth_date: "",
    phone: "",
    grade: "",
    school: "",
    ol_year: "",
    al_year: "",
    home_address: "",
  });

  // ✅ Persist form data in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("registerForm");
    if (saved) setFormData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("registerForm", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateCurrentStepFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    const isEmpty = (val: string) => !val.trim();

    if (currentStep === 0) {
      if (isEmpty(formData.name)) newErrors.name = "Name is required.";
      if (isEmpty(formData.email)) {
        newErrors.email = "Email is required.";
      } else if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|lk|org|net)$/i.test(
          formData.email
        )
      ) {
        newErrors.email = "Invalid email format.";
      }
      if (isEmpty(formData.password)) {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters.";
      }
    }

    if (currentStep === 1) {
      if (isEmpty(formData.birth_date))
        newErrors.birth_date = "Birth date is required.";
      if (isEmpty(formData.phone)) {
        newErrors.phone = "Phone number is required.";
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = "Phone number must be 10 digits.";
      }
      if (isEmpty(formData.school)) newErrors.school = "School is required.";
    }

    if (currentStep === 2) {
      if (isEmpty(formData.grade)) newErrors.grade = "Grade is required.";
      // O/L and A/L years are now optional if hidden, but here we still have them.
      // User said "these can be hide", so maybe they should be optional.
      // For now I'll keep them as they are but add home address.
      if (isEmpty(formData.home_address)) newErrors.home_address = "Home address is required.";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStepFields()) {
      setError("");
      setCurrentStep((prev) => prev + 1);
    } else {
      setError("Please correct the errors above.");
    }
  };

  const handlePrevious = () => setCurrentStep((prev) => prev - 1);

  // 🚀 Initial register: only triggers OTP
  const handleInitialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.register({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      setOtpStep(true);
      startResendCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Verify OTP & create user + student profile
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.verifyOtp({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        grade: formData.grade,
        school: formData.school,
        birth_date: formData.birth_date,
        ol_year: formData.ol_year,
        al_year: formData.al_year,
        home_address: formData.home_address,
        otp,
      });
      alert("Registration successful!");
      localStorage.removeItem("registerForm");
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const startResendCountdown = () => {
    setResendCountdown(30);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      setLoading(true);
      await authService.register({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      startResendCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-gray-100 dark:from-background-dark dark:to-gray-900 px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl bg-white dark:bg-neutral-900 md:grid md:grid-cols-2">
        <div className="hidden md:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50/60 border-r border-slate-100">
          <div className="relative w-64 h-64 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <Image
              src={CLAY_ASSETS.authLockShield}
              alt="Register Security Shield"
              fill
              className="object-contain pointer-events-none"
              priority
            />
          </div>
          <div className="text-center mt-4">
            <h3 className="text-base font-bold text-slate-800">Verified Student Registry</h3>
            <p className="text-xs text-slate-500 mt-1">Join the premier platform for academic excellence</p>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 md:px-12 md:py-16">
          <div className="w-full max-w-md space-y-10">
            <div className="md:hidden flex justify-center mb-2">
              <div className="relative w-20 h-20">
                <Image src={CLAY_ASSETS.authLockShield} alt="Shield" fill className="object-contain" priority />
              </div>
            </div>
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-semibold text-neutral-900 dark:text-white">
                {pagesConfig.auth.register.title}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-neutral-400">
                {otpStep
                  ? pagesConfig.auth.register.description.otp
                  : currentStep === 0
                  ? pagesConfig.auth.register.description.step0
                  : currentStep === 1
                  ? pagesConfig.auth.register.description.step1
                  : pagesConfig.auth.register.description.step2}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <form
                onSubmit={otpStep ? handleVerifyOtp : handleInitialRegister}
                className="space-y-6"
              >
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                {/* Step 0 */}
                {!otpStep && currentStep === 0 && (
                  <div className="space-y-4">
                    <InputWithError
                      id="name"
                      label={pagesConfig.auth.register.labels.name}
                      value={formData.name}
                      onChange={handleChange}
                      error={formErrors.name}
                    />
                    <InputWithError
                      id="email"
                      label={pagesConfig.auth.register.labels.email}
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={formErrors.email}
                    />
                    <InputWithError
                      id="password"
                      label={pagesConfig.auth.register.labels.password}
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={formErrors.password}
                    />
                    <Button onClick={handleNext} className="w-full">
                      {pagesConfig.auth.register.labels.next}
                    </Button>
                  </div>
                )}

                {/* Step 1 */}
                {!otpStep && currentStep === 1 && (
                  <div className="space-y-4">
                    <InputWithError
                      id="birth_date"
                      label={pagesConfig.auth.register.labels.birthDate}
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      error={formErrors.birth_date}
                    />
                    <InputWithError
                      id="school"
                      label={pagesConfig.auth.register.labels.school}
                      value={formData.school}
                      onChange={handleChange}
                      error={formErrors.school}
                    />
                    <InputWithError
                      id="phone"
                      label={pagesConfig.auth.register.labels.phone}
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={formErrors.phone}
                    />
                    <StepButtons
                      onPrevious={handlePrevious}
                      onNext={handleNext}
                      loading={loading}
                      pagesConfig={pagesConfig}
                    />
                  </div>
                )}

                {/* Step 2 */}
                {!otpStep && currentStep === 2 && (
                  <div className="space-y-4">
                    <InputWithError
                      id="grade"
                      label={pagesConfig.auth.register.labels.grade}
                      value={formData.grade}
                      onChange={handleChange}
                      error={formErrors.grade}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputWithError
                        id="ol_year"
                        label={pagesConfig.auth.register.labels.olYear}
                        type="number"
                        value={formData.ol_year}
                        onChange={handleChange}
                        error={formErrors.ol_year}
                      />
                      <InputWithError
                        id="al_year"
                        label={pagesConfig.auth.register.labels.alYear}
                        type="number"
                        value={formData.al_year}
                        onChange={handleChange}
                        error={formErrors.al_year}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="home_address">Home Address</Label>
                      <textarea
                        id="home_address"
                        value={formData.home_address}
                        onChange={handleChange}
                        placeholder="Full home address..."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                      {formErrors.home_address && <p className="text-sm text-red-500">{formErrors.home_address}</p>}
                    </div>
                    <StepButtons
                      onPrevious={handlePrevious}
                      submit
                      loading={loading}
                      label={pagesConfig.auth.register.labels.sendOtp}
                      pagesConfig={pagesConfig}
                    />
                  </div>
                )}

                {/* OTP Step */}
                {otpStep && (
                  <div className="space-y-4">
                    <InputWithError
                      id="otp"
                      label={pagesConfig.auth.register.labels.otp}
                      value={otp}
                      onChange={(e: any) => setOtp(e.target.value)}
                      error={formErrors.otp}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? pagesConfig.auth.register.labels.verifying : pagesConfig.auth.register.labels.verify}
                    </Button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0}
                      className="text-sm text-blue-600 disabled:text-gray-400"
                    >
                      {resendCountdown > 0
                        ? pagesConfig.auth.register.labels.resendIn.replace("{seconds}", resendCountdown.toString())
                        : pagesConfig.auth.register.labels.resend}
                    </button>
                  </div>
                )}
              </form>

              <Separator className="bg-neutral-200 dark:bg-neutral-700" />

              <p className="text-center text-sm text-muted-foreground dark:text-neutral-400">
                {pagesConfig.auth.register.labels.alreadyAccount}{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline hover:text-blue-700 transition"
                >
                  {pagesConfig.auth.register.labels.loginLink}
                </Link>
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}

// 🧩 Small helpers for cleaner JSX
function InputWithError({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} required />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StepButtons({
  onPrevious,
  onNext,
  submit = false,
  loading,
  label,
  pagesConfig,
}: any) {
  const nextLabel = label || pagesConfig.auth.register.labels.next;
  return (
    <div className="flex gap-4 pt-1">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        className="w-full"
        disabled={loading}
      >
        {pagesConfig.auth.register.labels.previous}
      </Button>
      <Button
        type={submit ? "submit" : "button"}
        onClick={submit ? undefined : onNext}
        className="w-full"
        disabled={loading}
      >
        {loading ? pagesConfig.auth.register.labels.loading : nextLabel}
      </Button>
    </div>
  );
}
