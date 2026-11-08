"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import DOMPurify from "dompurify";
import { decodeHtml } from "@/lib/utils";

export interface MathRendererProps {
  content?: string | null;
  className?: string;
  block?: boolean;
}

/**
 * Safely sanitizes HTML, with safe fallback during SSR where DOMPurify
 * does not have access to a browser window object.
 */
function sanitizeHtmlSafe(html: string): string {
  if (typeof window !== "undefined" && typeof DOMPurify?.sanitize === "function") {
    return DOMPurify.sanitize(html, {
      ADD_ATTR: ["class", "style", "data-list"],
      ADD_TAGS: ["iframe"],
    });
  }
  return html;
}

/**
 * MathRenderer component for rendering LaTeX formulas (inline $...$ and block $$...$$)
 * safely and cleanly using KaTeX.
 */
export const MathRenderer: React.FC<MathRendererProps> = React.memo(
  ({ content, className = "", block = false }) => {
    const renderedHtml = useMemo(() => {
      if (!content || typeof content !== "string") return "";

      const raw = decodeHtml(content.trim());
      if (!raw) return "";

      // Case 1: Explicit block formula or starts with LaTeX command (e.g. \frac, \sqrt, \int)
      if (block || /^\s*\\[a-zA-Z]/.test(raw)) {
        try {
          return katex.renderToString(raw, {
            displayMode: block,
            throwOnError: false,
            output: "html",
          });
        } catch {
          return sanitizeHtmlSafe(raw);
        }
      }

      // Case 2: Formula contains LaTeX delimiters ($...$ or $$...$$)
      // Extract math tokens into placeholders BEFORE sanitizing so inequality
      // signs (< and >) in math are never stripped as malformed HTML tags.
      const mathTokens: { placeholder: string; html: string }[] = [];
      let tokenCounter = 0;

      // Replace block math $$...$$
      let processed = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        const placeholder = `__MATH_BLOCK_${tokenCounter++}__`;
        try {
          const rendered = katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: "html",
          });
          mathTokens.push({
            placeholder,
            html: `<div class="katex-display-block my-2 overflow-x-auto py-1 text-center">${rendered}</div>`,
          });
        } catch {
          mathTokens.push({
            placeholder,
            html: `<span class="katex-error text-rose-500 font-mono text-xs">${math}</span>`,
          });
        }
        return placeholder;
      });

      // Replace inline math $...$
      // Uses lookahead/lookbehind to ensure $ is not followed/preceded by whitespace,
      // correctly distinguishing math from normal currency like "$5 and $10"
      processed = processed.replace(/(?<!\\)\$(?!\s)((?:\\\$|[^\$\n])+?)(?<!\s|\$)\$/g, (_, math) => {
        const placeholder = `__MATH_INLINE_${tokenCounter++}__`;
        try {
          const rendered = katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: "html",
          });
          mathTokens.push({
            placeholder,
            html: `<span class="katex-inline-block inline-block px-0.5">${rendered}</span>`,
          });
        } catch {
          mathTokens.push({
            placeholder,
            html: `<span class="katex-error text-rose-500 font-mono text-xs">${math}</span>`,
          });
        }
        return placeholder;
      });

      // Sanitize the outer HTML content with placeholders safely
      let result = sanitizeHtmlSafe(processed);

      // Re-insert rendered KaTeX math tokens
      for (const { placeholder, html } of mathTokens) {
        result = result.replace(placeholder, html);
      }

      return result;
    }, [content, block]);

    if (!renderedHtml) return null;

    return (
      <div
        className={`math-rendered-container prose-sm max-w-none text-inherit leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }
);

MathRenderer.displayName = "MathRenderer";

export default MathRenderer;
