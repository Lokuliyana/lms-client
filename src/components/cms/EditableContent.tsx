"use client";

import React, { useState, useEffect } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { FileEdit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableContentProps {
  contentKey: string;
  as?: React.ElementType;
  className?: string;
  defaultText?: string;
}

export function EditableContent({ contentKey, as: Component = "span", className, defaultText = "" }: EditableContentProps) {
  const { isEditMode, content, updateContent } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");

  // get nested value
  const keys = contentKey.split('.');
  let currentVal: any = content;
  for (const k of keys) {
    if (currentVal && currentVal[k] !== undefined) {
      currentVal = currentVal[k];
    } else {
      currentVal = undefined;
      break;
    }
  }
  
  const displayValue = (typeof currentVal === 'string' ? currentVal : defaultText) || defaultText;

  useEffect(() => {
    setValue(displayValue);
  }, [displayValue]);

  if (!isEditMode) {
    return <Component className={className}>{displayValue}</Component>;
  }

  if (isEditing) {
    return (
      <div className="relative inline-flex items-center gap-2">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          className="bg-white border border-blue-500 ring-2 ring-blue-50 rounded-lg text-slate-900 text-sm px-2.5 py-1.5 focus:outline-none"
          autoFocus
        />
        <button 
          onClick={() => {
            updateContent(contentKey, value);
            setIsEditing(false);
          }}
          className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
        >
          <Check className="w-4 h-4" />
        </button>
        <button 
          onClick={() => {
            setValue(displayValue);
            setIsEditing(false);
          }}
          className="p-1.5 bg-rose-100 text-rose-700 rounded hover:bg-rose-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Component 
      className={cn(
        className,
        "relative group cursor-pointer border border-dashed border-transparent hover:border-blue-400/80 hover:bg-blue-50/30 rounded-lg p-1 transition-all"
      )}
      onClick={() => setIsEditing(true)}
    >
      {displayValue}
      <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-soft-xs flex items-center gap-1 transition-opacity">
        <FileEdit className="w-3 h-3" /> Edit
      </div>
    </Component>
  );
}
