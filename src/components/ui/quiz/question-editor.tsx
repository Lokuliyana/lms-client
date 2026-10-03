"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/dev/label";
import { Input } from "@/components/dev/input";
import { Button } from "@/components/dev/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dev/select";
import { RadioGroup, RadioGroupItem } from "@/components/dev/radio-group";
import { Checkbox } from "@/components/dev/checkbox";
import { Slider } from "@/components/dev/slider";
import {
  PlusCircle,
  MinusCircle,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Eye,
  HelpCircle,
  Sparkles,
  Layers,
  FileQuestion,
  Image as ImageIcon,
} from "lucide-react";
import type { Question, QuestionEditorProps, QuestionType } from "@/types/quiz";
import Image from "next/image";
import { RichTextEditor } from "../rich-text-editor";
import { uploadMedia } from "@/services/mediaService";

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "true-false", label: "True / False" },
  { value: "fill-blank", label: "Fill in the Blank" },
  { value: "multiple-select", label: "Multiple Select" },
  { value: "slider", label: "Slider Range" },
  { value: "drag-drop", label: "Drag & Drop Matching" },
];

const defaultQuestion: Question = {
  id: Date.now(),
  type: "mcq",
  subject: "Math",
  question: "",
  explanation: "",
  options: ["", ""],
  correctAnswer: 0,
};

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function QuestionEditor({
  question,
  index,
  totalQuestions,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onRemove,
}: QuestionEditorProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isFullUrl = (url: string) => /^(?:https?:|data:|blob:)/.test(url);
  const handleChange = (field: keyof Question, value: any) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    handleChange("options", newOptions);
  };

  const addOption = () => {
    handleChange("options", [...(question.options || []), ""]);
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = (question.options || []).filter(
      (_, i) => i !== optionIndex
    );
    handleChange("options", newOptions);
    if (question.type === "mcq" && question.correctAnswer === optionIndex) {
      handleChange("correctAnswer", 0);
    } else if (question.type === "multiple-select") {
      const currentCorrect = (
        (question.correctAnswer as number[]) || []
      ).filter((idx) => idx !== optionIndex);
      handleChange(
        "correctAnswer",
        currentCorrect.map((idx) => (idx > optionIndex ? idx - 1 : idx))
      );
    }
  };

  const handleMultipleSelectCorrectAnswer = (
    optionIndex: number,
    checked: boolean
  ) => {
    const currentCorrect = (question.correctAnswer as number[]) || [];
    let newCorrect: number[];
    if (checked) {
      newCorrect = [...currentCorrect, optionIndex].sort((a, b) => a - b);
    } else {
      newCorrect = currentCorrect.filter((idx) => idx !== optionIndex);
    }
    handleChange("correctAnswer", newCorrect);
  };

  const handleDragItemChange = (itemIndex: number, value: string) => {
    const newItems = [...(question.dragItems?.items || [])];
    newItems[itemIndex] = value;
    handleChange("dragItems", { ...question.dragItems, items: newItems });
  };

  const addDragItem = () => {
    handleChange("dragItems", {
      ...question.dragItems,
      items: [...(question.dragItems?.items || []), ""],
    });
  };

  const removeDragItem = (itemIndex: number) => {
    const newItems = (question.dragItems?.items || []).filter(
      (_, i) => i !== itemIndex
    );
    handleChange("dragItems", { ...question.dragItems, items: newItems });
  };

  const handleMatchItemChange = (matchIndex: number, value: string) => {
    const newMatches = [...(question.dragItems?.matches || [])];
    newMatches[matchIndex] = value;
    handleChange("dragItems", { ...question.dragItems, matches: newMatches });
  };

  const addMatchItem = () => {
    handleChange("dragItems", {
      ...question.dragItems,
      matches: [...(question.dragItems?.matches || []), ""],
    });
  };

  const removeMatchItem = (matchIndex: number) => {
    const newMatches = (question.dragItems?.matches || []).filter(
      (_, i) => i !== matchIndex
    );
    handleChange("dragItems", { ...question.dragItems, matches: newMatches });
  };

  useEffect(() => {
    if (question.image) {
      if (isFullUrl(question.image)) {
        setImagePreviewUrl(question.image);
      } else {
        const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
        const baseUrl =
          process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
          (apiOrigin
            ? `${apiOrigin}/uploads`
            : "/uploads");
        setImagePreviewUrl(`${baseUrl}/${question.image}`);
      }
    } else {
      setImagePreviewUrl(null);
    }
  }, [question.image]);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    try {
      setImagePreviewUrl(URL.createObjectURL(file));

      const ownerId = String(question.id || question.frontend_id || (question as any)._id || "question");
      const res = await uploadMedia(file, "quiz", ownerId);

      if (res?.publicUrl) {
        handleChange("image", res.publicUrl);
        setImagePreviewUrl(res.publicUrl);
      } else {
        alert("Image upload failed.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload image.");
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
    handleChange("image", "");
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
      {/* CARD HEADER & REORDER BAR */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-slate-400">
            <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base">
              Question {index + 1}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {questionTypes.find((t) => t.value === question.type)?.label ||
                question.type}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onMoveUp && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              title="Move Question Up"
              className="h-8 w-8 p-0 bg-white"
            >
              <ChevronUp className="w-4 h-4 text-slate-600" />
            </Button>
          )}

          {onMoveDown && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveDown(index)}
              disabled={
                totalQuestions !== undefined
                  ? index >= totalQuestions - 1
                  : false
              }
              title="Move Question Down"
              className="h-8 w-8 p-0 bg-white"
            >
              <ChevronDown className="w-4 h-4 text-slate-600" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* SPLIT-PANE WORKSPACE */}
      <div className="p-5 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT PANE: Grouped Form Sections                         */}
        {/* ======================================================== */}
        <div className="xl:col-span-7 space-y-6">
          {/* SECTION 1: Details & Type */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>1. Details & Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`question-type-${index}`}>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value: QuestionType) => {
                    const newQuestion: Question = {
                      ...defaultQuestion,
                      id: question.id,
                      _id: question._id,
                      question: question.question,
                      explanation: question.explanation,
                      type: value,
                    };
                    if (value === "mcq" || value === "multiple-select") {
                      newQuestion.options = ["", ""];
                      newQuestion.correctAnswer = value === "mcq" ? 0 : [];
                    } else if (value === "true-false") {
                      newQuestion.correctAnswer = false;
                    } else if (value === "fill-blank") {
                      newQuestion.correctAnswer = "";
                    } else if (value === "slider") {
                      newQuestion.sliderRange = { min: 0, max: 10, step: 1 };
                      newQuestion.correctAnswer = 5;
                    } else if (value === "drag-drop") {
                      newQuestion.dragItems = {
                        items: ["", ""],
                        matches: ["", ""],
                      };
                      newQuestion.correctAnswer = [undefined, undefined] as any;
                    }
                    onUpdate(index, newQuestion);
                  }}
                >
                  <SelectTrigger
                    id={`question-type-${index}`}
                    className="bg-white"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`formula-${index}`}>Formula (LaTeX Syntax)</Label>
                <Input
                  id={`formula-${index}`}
                  value={question.formula || ""}
                  onChange={(e) => handleChange("formula", e.target.value)}
                  placeholder="e.g. E = mc^2"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Question Content */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <FileQuestion className="w-4 h-4 text-indigo-600" />
              <span>2. Question Content</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`question-text-${index}`}>
                Question Prompt <span className="text-rose-500">*</span>
              </Label>
              <RichTextEditor
                value={question.question}
                onChange={(value) => handleChange("question", value)}
                placeholder="Type the full question prompt here..."
                className="min-h-[140px] bg-white rounded-lg"
              />
            </div>
          </div>

          {/* SECTION 3: Options & Scoring */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Options & Correct Answers</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {question.type === "mcq"
                  ? "Select radio for correct answer"
                  : question.type === "multiple-select"
                  ? "Check all applicable correct options"
                  : "Specify expected value"}
              </span>
            </div>

            {/* MCQ Options */}
            {question.type === "mcq" && (
              <div className="space-y-3">
                <RadioGroup
                  value={question.correctAnswer?.toString()}
                  onValueChange={(value) =>
                    handleChange("correctAnswer", Number.parseInt(value))
                  }
                  className="space-y-2.5"
                >
                  {question.options?.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 focus-within:border-indigo-500"
                    >
                      <RadioGroupItem
                        value={optIndex.toString()}
                        id={`mcq-option-${index}-${optIndex}`}
                        className="ml-1"
                      />
                      <span className="font-bold text-xs text-slate-400 w-4 text-center">
                        {OPTION_LETTERS[optIndex] || optIndex + 1}
                      </span>
                      <Input
                        id={`mcq-option-text-${index}-${optIndex}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(optIndex, e.target.value)
                        }
                        placeholder={`Option ${optIndex + 1} text`}
                        className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2 h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(optIndex)}
                        disabled={(question.options?.length || 0) <= 2}
                        className="h-8 w-8 text-slate-400 hover:text-rose-500"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </RadioGroup>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Add Option Choice
                </Button>
              </div>
            )}

            {/* True/False */}
            {question.type === "true-false" && (
              <RadioGroup
                value={question.correctAnswer?.toString()}
                onValueChange={(value) =>
                  handleChange("correctAnswer", value === "true")
                }
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor={`tf-true-${index}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-400 transition"
                >
                  <RadioGroupItem value="true" id={`tf-true-${index}`} />
                  <span className="font-semibold text-sm text-slate-800">
                    True
                  </span>
                </label>
                <label
                  htmlFor={`tf-false-${index}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-400 transition"
                >
                  <RadioGroupItem value="false" id={`tf-false-${index}`} />
                  <span className="font-semibold text-sm text-slate-800">
                    False
                  </span>
                </label>
              </RadioGroup>
            )}

            {/* Fill-blank */}
            {question.type === "fill-blank" && (
              <div className="space-y-1.5">
                <Label htmlFor={`fill-blank-${index}`}>Expected Answer</Label>
                <Input
                  id={`fill-blank-${index}`}
                  value={(question.correctAnswer as string) || ""}
                  onChange={(e) => handleChange("correctAnswer", e.target.value)}
                  placeholder="Enter accepted string or numeric answer"
                  className="bg-white"
                />
              </div>
            )}

            {/* Multiple Select */}
            {question.type === "multiple-select" && (
              <div className="space-y-3">
                {question.options?.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200"
                  >
                    <Checkbox
                      checked={(
                        (question.correctAnswer as number[]) || []
                      ).includes(optIndex)}
                      onCheckedChange={(checked) =>
                        handleMultipleSelectCorrectAnswer(
                          optIndex,
                          checked as boolean
                        )
                      }
                      id={`multi-select-${index}-${optIndex}`}
                      className="ml-1"
                    />
                    <span className="font-bold text-xs text-slate-400 w-4 text-center">
                      {OPTION_LETTERS[optIndex] || optIndex + 1}
                    </span>
                    <Input
                      id={`multi-text-${index}-${optIndex}`}
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(optIndex, e.target.value)
                      }
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2 h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optIndex)}
                      disabled={(question.options?.length || 0) <= 2}
                      className="h-8 w-8 text-slate-400 hover:text-rose-500"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="w-full bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Add Multiple-Select
                  Option
                </Button>
              </div>
            )}

            {/* Slider */}
            {question.type === "slider" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      value={question.sliderRange?.min ?? 0}
                      onChange={(e) =>
                        handleChange("sliderRange", {
                          ...question.sliderRange,
                          min: Number(e.target.value),
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      value={question.sliderRange?.max ?? 10}
                      onChange={(e) =>
                        handleChange("sliderRange", {
                          ...question.sliderRange,
                          max: Number(e.target.value),
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Step</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={question.sliderRange?.step ?? 1}
                      onChange={(e) =>
                        handleChange("sliderRange", {
                          ...question.sliderRange,
                          step: Number(e.target.value),
                        })
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correct Target Value</Label>
                  <Input
                    type="number"
                    value={(question.correctAnswer as number) ?? 0}
                    onChange={(e) =>
                      handleChange("correctAnswer", Number(e.target.value))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            {/* Drag & Drop */}
            {question.type === "drag-drop" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Source Items</Label>
                    {question.dragItems?.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-1.5">
                        <Input
                          value={item}
                          onChange={(e) =>
                            handleDragItemChange(itemIdx, e.target.value)
                          }
                          placeholder={`Item ${itemIdx + 1}`}
                          className="bg-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDragItem(itemIdx)}
                          disabled={(question.dragItems?.items.length || 0) <= 2}
                          className="h-8 w-8 text-rose-500"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDragItem}
                      className="w-full bg-white text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Target Matches</Label>
                    {question.dragItems?.matches.map((match, matchIdx) => (
                      <div key={matchIdx} className="flex items-center gap-1.5">
                        <Input
                          value={match}
                          onChange={(e) =>
                            handleMatchItemChange(matchIdx, e.target.value)
                          }
                          placeholder={`Match ${matchIdx + 1}`}
                          className="bg-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMatchItem(matchIdx)}
                          disabled={
                            (question.dragItems?.matches.length || 0) <= 2
                          }
                          className="h-8 w-8 text-rose-500"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMatchItem}
                      className="w-full bg-white text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Match
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Media & Explanation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>4. Media & Explanation</span>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Question Figure / Attachment (Optional)</Label>
              <input
                id={`image-upload-${index}`}
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />

              {imagePreviewUrl ? (
                <div className="relative w-full h-40 rounded-xl border border-slate-200 bg-white group overflow-hidden">
                  <Image
                    src={imagePreviewUrl}
                    alt={`Question ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-white/90 text-rose-500 hover:bg-white"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                  onClick={handleImageUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <p className="text-xs font-semibold text-slate-700">
                    Click or drag image here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, SVG up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor={`explanation-${index}`}>
                Explanation (Shown to students after completing quiz)
              </Label>
              <RichTextEditor
                value={question.explanation || ""}
                onChange={(value) => handleChange("explanation", value)}
                placeholder="Explain why the answer is correct..."
                className="min-h-[100px] bg-white rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Live Student-Facing Preview                 */}
        {/* ======================================================== */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-4">
          <div className="rounded-2xl border-2 border-indigo-200/80 bg-slate-900 text-white p-5 shadow-lg space-y-4">
            {/* Live Indicator Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Student View
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Q{index + 1} of {totalQuestions || index + 1}
              </span>
            </div>

            {/* Question Card Mockup */}
            <div className="space-y-3">
              {/* Question Image if any */}
              {imagePreviewUrl && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <Image
                    src={imagePreviewUrl}
                    alt="Question visual"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Question Prompt */}
              <div>
                {question.question ? (
                  <div
                    className="text-sm font-semibold text-slate-100 leading-relaxed prose prose-invert max-w-none text-left"
                    dangerouslySetInnerHTML={{ __html: question.question }}
                  />
                ) : (
                  <p className="text-sm italic text-slate-500">
                    Question text will appear here in real-time...
                  </p>
                )}
              </div>

              {/* Formula Preview */}
              {question.formula && (
                <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-mono text-indigo-300">
                  {question.formula}
                </div>
              )}

              {/* Interactive Options Preview */}
              <div className="space-y-2 pt-2">
                {/* MCQ Mode */}
                {question.type === "mcq" && (
                  <div className="space-y-2">
                    {question.options?.map((opt, optIdx) => {
                      const isCorrect = question.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition ${
                            isCorrect
                              ? "border-emerald-500/80 bg-emerald-950/40 text-emerald-200"
                              : "border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {OPTION_LETTERS[optIdx] || optIdx + 1}
                            </span>
                            <span>{opt || `Option ${optIdx + 1}`}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/False Mode */}
                {question.type === "true-false" && (
                  <div className="grid grid-cols-2 gap-2">
                    {["true", "false"].map((val) => {
                      const isCorrect =
                        String(question.correctAnswer) === val;
                      return (
                        <div
                          key={val}
                          className={`p-3 rounded-xl border text-center font-bold text-xs capitalize ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                              : "border-slate-800 bg-slate-800/50 text-slate-400"
                          }`}
                        >
                          {val}
                          {isCorrect && " (Correct)"}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Multiple Select Mode */}
                {question.type === "multiple-select" && (
                  <div className="space-y-2">
                    {question.options?.map((opt, optIdx) => {
                      const isCorrect = (
                        (question.correctAnswer as number[]) || []
                      ).includes(optIdx);
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                            isCorrect
                              ? "border-emerald-500/80 bg-emerald-950/40 text-emerald-200"
                              : "border-slate-800 bg-slate-800/50 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                                isCorrect
                                  ? "bg-emerald-600 text-white font-bold"
                                  : "border border-slate-600 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span>{opt || `Choice ${optIdx + 1}`}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill-blank Mode */}
                {question.type === "fill-blank" && (
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-800/40 space-y-1.5">
                    <p className="text-[11px] text-slate-400">Student input box:</p>
                    <div className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-500 italic">
                      [ Student types answer here ]
                    </div>
                    {question.correctAnswer ? (
                      <p className="text-[11px] text-emerald-400 pt-1">
                        Accepted answer: <strong>{String(question.correctAnswer)}</strong>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Explanation Preview */}
            {question.explanation && (
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explanation (Post-Submission)</span>
                </div>
                <div
                  className="text-xs text-slate-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.explanation }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
