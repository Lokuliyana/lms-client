"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "@/components/dev/label";
import { Input } from "@/components/dev/input";
import { Textarea } from "@/components/dev/textarea";
import { Button } from "@/components/dev/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import {
  HiAcademicCap,
  HiCalendarDays,
  HiCurrencyRupee,
  HiPlus,
  HiTrash,
  HiPhoto,
  HiXMark,
  HiArrowUpTray,
} from "react-icons/hi2";
import { uploadMedia } from "@/services/mediaService";
import { useTaxonomy } from "@/context/CustomizationContext";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { cn } from "@/lib/utils";

interface Props {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function ClassForm({
  initialData,
  onSubmit,
  submitLabel = "Create Class",
  isLoading = false,
}: Props) {
  const router = useRouter();
  const { subjects, grades } = useTaxonomy();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [grade, setGrade] = useState(initialData?.grade || "");
  const [classFormat, setClassFormat] = useState(initialData?.format || "");
  const [classType, setClassType] = useState(initialData?.type || "");
  const [deliveryType, setDeliveryType] = useState(initialData?.delivery_type || "online_only");
  const [fee, setFee] = useState(initialData?.price || "");
  const [batches, setBatches] = useState<{ day: string; start: string; end: string }[]>(
    initialData?.batches || [{ day: "", start: "", end: "" }]
  );

  // Public URL flow
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.image || null);
  const [imagePersistValue, setImagePersistValue] = useState<string | null>(initialData?.image || null);

  // upload states
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    classFormat: "",
    classType: "",
    fee: "",
    batches: "",
  });

  // Optional: warn when leaving during upload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = ""; // required for Chrome
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploading]);

  const handleAddBatch = () => setBatches((prev) => [...prev, { day: "", start: "", end: "" }]);
  const handleRemoveBatch = (index: number) => setBatches((prev) => prev.filter((_, i) => i !== index));
  const handleBatchChange = (index: number, field: "day" | "start" | "end", value: string) => {
    setBatches((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ---- file pick/drag/drop handlers (PUBLIC) ----
  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setImagePreviewUrl(null);
      setImagePersistValue(null);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);
    setUploading(true);
    setUploadPct(0);

    try {
      const ownerType = "class";
      const ownerId = initialData?._id || "new";
      const { publicUrl } = await uploadMedia(file, ownerType, ownerId, (pct) => {
        setUploadPct(pct);
      });

      setImagePreviewUrl(publicUrl);
      setImagePersistValue(publicUrl);
    } catch (e) {
      console.error("Image upload failed:", e);
      alert("Image upload failed");
      setImagePreviewUrl(null);
      setImagePersistValue(null);
    } finally {
      URL.revokeObjectURL(localUrl);
      setUploading(false);
    }
  };

  const handleImageUploadClick = () => fileInputRef.current?.click();
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFileChange(file);
  };

  const handleClearImage = () => {
    if (uploading) return;
    setImagePreviewUrl(null);
    setImagePersistValue(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- submit ----
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (uploading) {
      alert("Please wait until the image finishes uploading.");
      return;
    }

    if (!title || !description || !subject || !grade || !classFormat || !classType || !fee) {
      alert("Please fill in all required fields.");
      return;
    }

    const newErrors = {
      title: title ? "" : "Title is required.",
      description: description ? "" : "Description is required.",
      subject: subject ? "" : "Subject is required.",
      grade: grade ? "" : "Grade is required.",
      classFormat: classFormat ? "" : "Class Format is required.",
      classType: classType ? "" : "Class type is required.",
      fee: fee ? "" : "Fee is required.",
      batches: batches.every((b) => b.day && b.start && b.end)
        ? ""
        : "All batch fields must be filled.",
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      const payload = {
        title,
        description,
        subject,
        grade,
        type: classType,
        format: classFormat,
        delivery_type: deliveryType,
        price: parseFloat(fee),
        batches,
        image: imagePersistValue || undefined,
      };

      await onSubmit(payload);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit class form.");
    }
  };

  const commonInputClasses =
    "bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition-all";

  const isEdit = Boolean(initialData);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Top Section Header Pastel Capsule */}
      <SectionHeader
        title={isEdit ? "Edit Class" : "Create Class"}
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: isEdit ? "Edit Class" : "Create Class" },
        ]}
        description={
          isEdit
            ? "Update course curriculum, timing batches, and pricing details."
            : "Set up a new virtual classroom, scheduled time batches, and subject taxonomy."
        }
        illustration={CLAY_ASSETS.thumbTheoryOpenbook}
        variant="rose"
        icon={HiAcademicCap as any}
      />

      {/* 2. Structured Multi-Card Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column: Details & Scheduling */}
          <div className="lg:col-span-8 space-y-6">
            <CardSection
              title="Class Details"
              description="Basic information, subject taxonomy, and delivery formats."
              icon={HiAcademicCap as any}
            >
              <div className="space-y-4 pt-1">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
                    Class Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    name="title"
                    placeholder="e.g. ICT - 2026 Theory"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={cn(commonInputClasses, "mt-1")}
                  />
                  {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                    Description & Syllabus <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    name="description"
                    rows={4}
                    placeholder="Enter an outline of this class, upcoming milestones, and prerequisites..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(commonInputClasses, "mt-1")}
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Subject & Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Subject <span className="text-rose-500">*</span>
                    </Label>
                    <div className="mt-1">
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className={commonInputClasses}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects
                            .filter((s: any) => s.is_active !== false)
                            .map((s: any) => (
                              <SelectItem
                                key={s._id || s.name}
                                value={s._id ? String(s._id) : s.name.toLowerCase()}
                              >
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.subject && (
                      <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Grade Level <span className="text-rose-500">*</span>
                    </Label>
                    <div className="mt-1">
                      <Select value={grade} onValueChange={setGrade}>
                        <SelectTrigger className={commonInputClasses}>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades
                            .filter((g: any) => g.is_active !== false)
                            .map((g: any) => {
                              const gradeVal = g._id
                                ? String(g._id)
                                : (g.name || "").replace(/^grade\s*/i, "").trim() || g.name;
                              return (
                                <SelectItem key={g._id || g.name} value={gradeVal}>
                                  {g.name.toLowerCase().startsWith("grade")
                                    ? g.name
                                    : `Grade ${g.name}`}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.grade && <p className="text-xs text-rose-500 mt-1">{errors.grade}</p>}
                  </div>
                </div>

                {/* Format, Type, Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Class Format <span className="text-rose-500">*</span>
                    </Label>
                    <div className="mt-1">
                      <Select value={classFormat} onValueChange={setClassFormat}>
                        <SelectTrigger className={commonInputClasses}>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory">Theory</SelectItem>
                          <SelectItem value="revision">Revision</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.classFormat && (
                      <p className="text-xs text-rose-500 mt-1">{errors.classFormat}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Class Type <span className="text-rose-500">*</span>
                    </Label>
                    <div className="mt-1">
                      <Select value={classType} onValueChange={setClassType}>
                        <SelectTrigger className={commonInputClasses}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="special">Special</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.classType && (
                      <p className="text-xs text-rose-500 mt-1">{errors.classType}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Delivery Mode <span className="text-rose-500">*</span>
                    </Label>
                    <div className="mt-1">
                      <Select value={deliveryType} onValueChange={setDeliveryType}>
                        <SelectTrigger className={commonInputClasses}>
                          <SelectValue placeholder="Select delivery" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online_only">Online Only</SelectItem>
                          <SelectItem value="physical_tute">Physical Tute</SelectItem>
                          <SelectItem value="both">Both (Online + Physical)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardSection>

            {/* Scheduling Section */}
            <CardSection
              title="Class Schedules & Batches"
              description="Configure live interactive stream schedules and lecture days."
              icon={HiCalendarDays as any}
            >
              <div className="space-y-4 pt-1">
                {batches.map((batch, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-wrap md:flex-nowrap md:items-end gap-3"
                  >
                    <div className="w-full md:w-1/3">
                      <Label className="text-xs font-semibold text-slate-700">Day of Week</Label>
                      <div className="mt-1">
                        <Select
                          value={batch.day}
                          onValueChange={(v) => handleBatchChange(index, "day", v)}
                        >
                          <SelectTrigger className={commonInputClasses}>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                              "saturday",
                              "sunday",
                            ].map((d) => (
                              <SelectItem key={d} value={d}>
                                {d[0].toUpperCase() + d.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="w-full md:w-1/3">
                      <Label className="text-xs font-semibold text-slate-700">Start Time</Label>
                      <Input
                        type="time"
                        value={batch.start}
                        onChange={(e) => handleBatchChange(index, "start", e.target.value)}
                        className={cn(commonInputClasses, "mt-1")}
                      />
                    </div>

                    <div className="w-full md:w-1/3">
                      <Label className="text-xs font-semibold text-slate-700">End Time</Label>
                      <Input
                        type="time"
                        value={batch.end}
                        onChange={(e) => handleBatchChange(index, "end", e.target.value)}
                        className={cn(commonInputClasses, "mt-1")}
                      />
                    </div>

                    {batches.length > 1 && (
                      <div className="w-full md:w-auto flex justify-end md:justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveBatch(index)}
                          className="h-10 w-10 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
                          title="Remove time slot"
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {errors.batches && <p className="text-xs text-rose-500">{errors.batches}</p>}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBatch}
                  className="w-full h-10 rounded-xl border-dashed border-rose-200 text-rose-600 hover:bg-rose-50/50 hover:border-rose-300 font-semibold text-xs"
                >
                  <HiPlus className="w-4 h-4 mr-1.5" /> Add Another Time Batch
                </Button>
              </div>
            </CardSection>
          </div>

          {/* Side Column: Thumbnail & Pricing & Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Class Image Section */}
            <CardSection
              title="Class Thumbnail"
              description="High quality cover banner."
              icon={HiPhoto as any}
            >
              <div className="space-y-3 pt-1">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={uploading}
                />

                {imagePreviewUrl ? (
                  <div className="relative w-full h-44 rounded-xl border border-slate-200/90 bg-slate-50 overflow-hidden shadow-2xs group">
                    <Image
                      src={imagePreviewUrl}
                      alt="Class Preview"
                      fill
                      className={`object-cover object-center transition-all ${
                        uploading ? "opacity-75 blur-xs" : "group-hover:scale-105 duration-300"
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClearImage}
                      disabled={uploading}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg shadow-xs"
                    >
                      <HiXMark className="w-4 h-4" />
                    </Button>
                    {uploading && (
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 p-2">
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 transition-all duration-200"
                            style={{ width: `${uploadPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-white font-medium mt-1 text-center">
                          Uploading… {uploadPct}%
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDragging
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300"
                    } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={() => !uploading && handleImageUploadClick()}
                    onDragOver={(e) => !uploading && handleDragOver(e)}
                    onDragLeave={() => !uploading && handleDragLeave()}
                    onDrop={(e) => !uploading && handleDrop(e)}
                    aria-disabled={uploading}
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-slate-500 mb-2">
                      <HiArrowUpTray className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">
                      {uploading ? "Uploading image…" : "Click or drag class cover"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                    {uploading && (
                      <div className="w-3/4 mt-3">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all"
                            style={{ width: `${uploadPct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-center">
                          {uploadPct}%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardSection>

            {/* Tuition Pricing Section */}
            <CardSection
              title="Tuition & Fee"
              description="Monthly student tuition."
              icon={HiCurrencyRupee as any}
            >
              <div className="space-y-3 pt-1">
                <div>
                  <Label htmlFor="class-fee" className="text-xs font-semibold text-slate-700">
                    Monthly Fee (LKR) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rs.
                    </span>
                    <Input
                      name="class-fee"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 3500.00"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className={cn(commonInputClasses, "pl-10 font-medium")}
                    />
                  </div>
                  {errors.fee && <p className="text-xs text-rose-500 mt-1">{errors.fee}</p>}
                </div>
              </div>
            </CardSection>

            {/* Form Actions: Vibrant Red/Rose CTA matching screenshots */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || uploading}
                className="w-full h-11 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
              >
                {uploading ? `Uploading… ${uploadPct}%` : submitLabel}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading || uploading}
                className="w-full h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
