"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean;
  content: Record<string, any>;
  updateContent: (key: string, value: any) => Promise<void>;
}

const EditModeContext = createContext<EditModeContextType | null>(null);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const { hasPermissionSync } = usePermissions();
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<Record<string, any>>({});
  
  const canEdit = hasPermissionSync("cms.edit");

  useEffect(() => {
    fetch("/api/admin/content")
      .then(res => res.json())
      .then(data => setContent(data || {}))
      .catch(console.error);
  }, []);

  const toggleEditMode = () => {
    if (canEdit) {
      setIsEditMode(!isEditMode);
    }
  };

  const updateContent = async (key: string, value: any) => {
    if (!canEdit) return;
    
    // optimistic update
    const keys = key.split('.');
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setContent(newContent);

    // save to server
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    });
  };

  return (
    <EditModeContext.Provider value={{ isEditMode: isEditMode && canEdit, toggleEditMode, canEdit, content, updateContent }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error("useEditMode must be used within EditModeProvider");
  return ctx;
}
