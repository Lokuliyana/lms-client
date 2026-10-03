"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  Type,
  Palette,
  Highlighter,
  Heading1,
  Heading2,
  List,
} from "lucide-react";

// Import Quill styles
import "react-quill-new/dist/quill.snow.css";
import "react-quill-new/dist/quill.bubble.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic<any>(() => import("react-quill-new"), { ssr: false });

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const COLORS = [
  "#000000",
  "#444444",
  "#888888",
  "#c0c0c0",
  "#ffffff",
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
];

const HIGHLIGHTS = [
  "transparent",
  "#fef08a", // yellow-200
  "#bbf7d0", // green-200
  "#bfdbfe", // blue-200
  "#fbcfe8", // pink-200
  "#e5e7eb", // gray-200
];

export default function TextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
}: TextEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formats, setFormats] = useState<any>({});
  
  // Sub-menus
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Handle selection change to show/hide toolbar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = (range: any, source: any, editor: any) => {
    if (range && range.length > 0) {
      const bounds = editor.getBounds(range.index, range.length);
      // Calculate position relative to the container
      // bounds: { left, top, height, width }
      
      // We want the toolbar centered above the selection
      const top = bounds.top - 60; // 60px above
      const left = bounds.left + bounds.width / 2;

      setToolbarPos({ top, left });
      setShowToolbar(true);
      setFormats(editor.getFormat(range));
    } else {
      setShowToolbar(false);
      setShowColorPicker(false);
      setShowHighlightPicker(false);
    }
  };

  // Apply formatting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const format = (fmt: string, val: any) => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    editor.format(fmt, val);
    setFormats({ ...formats, [fmt]: val });
  };

  const toggleFormat = (fmt: string) => {
    format(fmt, !formats[fmt]);
  };

  // Custom Toolbar Component
  const FloatingToolbar = () => {
    if (!toolbarPos) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute z-50 flex items-center gap-1 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200/60 text-slate-700"
        style={{
          top: toolbarPos.top,
          left: toolbarPos.left,
          transform: "translateX(-50%)", // Center horizontally
        }}
        onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
      >
        {/* Font Size / Headers */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1.5">
           <button
            onClick={() => format("header", 1)}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.header === 1 ? "bg-indigo-50 text-indigo-600" : ""}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => format("header", 2)}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.header === 2 ? "bg-indigo-50 text-indigo-600" : ""}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
           <button
            onClick={() => format("header", false)}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${!formats.header ? "bg-indigo-50 text-indigo-600" : ""}`}
            title="Normal Text"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Basic Styles */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1.5">
          <button
            onClick={() => toggleFormat("bold")}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.bold ? "bg-indigo-50 text-indigo-600" : ""}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFormat("italic")}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.italic ? "bg-indigo-50 text-indigo-600" : ""}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFormat("underline")}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.underline ? "bg-indigo-50 text-indigo-600" : ""}`}
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1.5 relative">
          <button
            onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${showColorPicker ? "bg-slate-100" : ""}`}
            title="Text Color"
          >
            <Palette className="w-4 h-4" style={{ color: formats.color || 'inherit' }} />
          </button>
          
          <button
            onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${showHighlightPicker ? "bg-slate-100" : ""}`}
            title="Highlight Color"
          >
            <Highlighter className="w-4 h-4" style={{ color: formats.background && formats.background !== 'transparent' ? formats.background : 'inherit' }} />
          </button>

          {/* Color Picker Popup */}
          <AnimatePresence>
            {showColorPicker && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-4 gap-1 w-32 z-50"
                >
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                format("color", c);
                                setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition"
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

           {/* Highlight Picker Popup */}
           <AnimatePresence>
            {showHighlightPicker && (
                <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-3 gap-1 w-24 z-50"
                >
                    {HIGHLIGHTS.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                format("background", c);
                                setShowHighlightPicker(false);
                            }}
                            className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition relative overflow-hidden"
                            style={{ backgroundColor: c }}
                        >
                            {c === 'transparent' && <div className="absolute inset-0 border-r border-red-500 transform rotate-45" />}
                        </button>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alignment & Lists */}
        <div className="flex items-center gap-0.5">
             <button
                onClick={() => format("align", "")} // default left
                className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${!formats.align ? "bg-indigo-50 text-indigo-600" : ""}`}
             >
                <AlignLeft className="w-4 h-4" />
             </button>
             <button
                onClick={() => format("align", "center")}
                className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.align === "center" ? "bg-indigo-50 text-indigo-600" : ""}`}
             >
                <AlignCenter className="w-4 h-4" />
             </button>
             <button
                onClick={() => format("list", "bullet")}
                className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${formats.list === "bullet" ? "bg-indigo-50 text-indigo-600" : ""}`}
             >
                <List className="w-4 h-4" />
             </button>
        </div>

      </motion.div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <ReactQuill
        ref={quillRef}
        theme="bubble"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onChangeSelection={handleSelectionChange}
        modules={{
          toolbar: false, // We use our custom toolbar
        }}
        className="text-editor-content"
      />
      
      <AnimatePresence>
        {showToolbar && <FloatingToolbar />}
      </AnimatePresence>

      <style jsx global>{`
        .text-editor-content .ql-editor {
            font-family: var(--font-inter), sans-serif;
            font-size: 1rem;
            line-height: 1.6;
            min-height: 150px;
            padding: 1rem;
        }
        .text-editor-content .ql-editor.ql-blank::before {
            color: #94a3b8;
            font-style: normal;
        }
        /* Hide default tooltip if any leaks through */
        .ql-tooltip {
            display: none !important;
        }
      `}</style>
    </div>
  );
}
