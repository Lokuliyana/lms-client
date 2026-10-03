"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditMode } from "@/context/EditModeContext";
import TextEditor from "@/components/ui/text-editor";
import { Button } from "@/components/dev/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface EditableContentProps {
  configKey: string;
  initialValue: string;
  className?: string;
  as?: React.ElementType; // e.g., 'h1', 'p', 'span'
}

export default function EditableContent({
  configKey,
  initialValue,
  className = "",
  as: Component = "div",
}: EditableContentProps) {
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [tempValue, setTempValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const contentEditableRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if user is teacher
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === "teacher" || user.role === "admin" || user.role === "moderator") {
          setCanEdit(true);
        }
      }
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
  }, []);

  useEffect(() => {
    setValue(initialValue);
    setTempValue(initialValue);
  }, [initialValue]);

  const hasHtml = /<[a-z][\s\S]*>/i.test(value);

  useEffect(() => {
    if (isEditing && !hasHtml && contentEditableRef.current) {
      contentEditableRef.current.focus();
      // Move cursor to the end
      if (typeof window !== "undefined") {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentEditableRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isEditing, hasHtml]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalValue = (!hasHtml && contentEditableRef.current)
        ? contentEditableRef.current.textContent || ""
        : tempValue;

      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: configKey,
          value: finalValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setValue(finalValue);
      setTempValue(finalValue);
      setIsEditing(false);
      toast({
        title: "Content updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditMode || !canEdit) {
    // Render as normal component, but parse HTML if it contains tags
    // We use a simple check for HTML tags. If present, use dangerouslySetInnerHTML
    if (hasHtml) {
      return (
        <Component
          className={className}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }
    return <Component className={className}>{value}</Component>;
  }

  if (isEditing) {
    if (!hasHtml) {
      // INLINE PLAIN TEXT EDITING (inherits all styles perfectly)
      return (
        <div className="relative group z-50 inline-block w-full">
          <Component className={className}>
            <span
              ref={contentEditableRef as any}
              contentEditable
              suppressContentEditableWarning
              className="outline-none bg-indigo-50/40 border border-indigo-200/60 focus:bg-white focus:border-indigo-400 focus:shadow-sm rounded-lg px-2 -mx-2 py-0.5 -my-0.5 transition-all inline-block min-w-[20px]"
              onBlur={(e) => setTempValue(e.currentTarget.textContent || "")}
              onInput={(e) => setTempValue(e.currentTarget.textContent || "")}
            >
              {value}
            </span>
          </Component>
          
          <div className="absolute top-full left-0 mt-2 flex gap-1.5 p-1 bg-white/95 backdrop-blur-lg border border-slate-200/60 rounded-xl shadow-lg z-50">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 w-7 p-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-100/50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      );
    }

    // RICH TEXT EDITING
    return (
      <div className="relative group z-10 w-full">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-200 hover:shadow-md hover:border-indigo-300/50">
          <div className={className}>
            <TextEditor
              value={tempValue}
              onChange={setTempValue}
              className="min-h-[60px] pb-12"
            />
          </div>
          <div className="absolute bottom-2 right-2 flex justify-end gap-1.5 p-1 bg-white/90 backdrop-blur-lg border border-slate-100/50 rounded-xl shadow-sm">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 w-7 p-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-100/50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode Preview (Click to edit)
  const MotionWrapper = Component === "span" ? motion.span : motion.div;

  return (
    <MotionWrapper
      layout
      onClick={() => setIsEditing(true)}
      className={`relative cursor-pointer group/edit transition-all duration-300 ${className}`}
    >
      {/* Render content safely */}
      {/<[a-z][\s\S]*>/i.test(value) ? (
        <Component dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <Component>{value}</Component>
      )}
      
      {/* Subtle Hover indicator - only visible on hover */}
      <div className="absolute inset-0 -m-1.5 rounded-xl border border-transparent group-hover/edit:border-indigo-200/50 group-hover/edit:bg-indigo-50/30 pointer-events-none transition-all duration-300" />
      
      {/* Edit icon/badge on hover */}
      <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover/edit:opacity-100 transition-all duration-300 transform scale-90 group-hover/edit:scale-100 z-10 pointer-events-none">
        <span className="bg-white/95 backdrop-blur-sm text-indigo-500 border border-indigo-100 p-1.5 rounded-full shadow-sm flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </span>
      </div>
    </MotionWrapper>
  );
}
