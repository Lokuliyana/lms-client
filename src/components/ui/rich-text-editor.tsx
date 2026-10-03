"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Loader2 } from "lucide-react";

// Dynamic import to avoid SSR issues with Quill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full flex items-center justify-center bg-slate-50 border rounded-md">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  ),
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline", "strike"], // toggled buttons
        ["blockquote", "code-block"],
        [{ script: "sub" }, { script: "super" }], // superscript/subscript
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
        [{ header: [1, 2, 3, false] }],
        [{ color: [] }, { background: [] }], // dropdown with defaults from theme
        [{ align: [] }],
        ["clean"], // remove formatting button
      ],
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "indent",
    "script",
    "color",
    "background",
    "align",
  ];

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <style jsx global>{`
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background-color: white;
        }
        .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f8fafc;
          border-color: #e2e8f0 !important;
        }
        .ql-container.ql-snow {
          border-color: #e2e8f0 !important;
        }
        .ql-editor {
          min-height: 150px;
        }
        .ql-editor.ql-blank::before {
          font-style: normal;
          color: #94a3b8;
        }
        /* Reset Quill's default ordered list styles */
        .ql-editor ol {
          padding-left: 0;
          margin-left: 1.5em;
        }
        
        .ql-editor ol > li {
          list-style-type: upper-alpha !important;
          padding-left: 0.5em !important;
        }

        /* Hide Quill's generated numbers - targeting specific Quill selectors */
        .ql-editor li[data-list=ordered] {
          counter-reset: list-0 !important; /* Reset Quill's counter */
          list-style-type: upper-alpha !important;
        }
        
        /* Hide Quill's default counter pseudo-element */
        .ql-editor li[data-list=ordered]::before {
          display: none !important;
          content: none !important;
        }

        /* Hide Quill's UI span if present (common in some versions) */
        .ql-editor li[data-list=ordered] > .ql-ui {
          display: none !important;
        }

        /* Also target the general ol > li just in case */
        .ql-editor ol > li::before {
          display: none !important;
          content: none !important;
        }
        
        /* Ensure nested lists also work if needed */
        .ql-editor ol li.ql-indent-1 { padding-left: 2em !important; }
        .ql-editor ol li.ql-indent-2 { padding-left: 3.5em !important; }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
