import type * as React from "react"

interface TitleProps {
  variant: "page" | "section"
  subtitle?: string
  children: React.ReactNode
}

export const Title: React.FC<TitleProps> = ({ variant, subtitle, children }) => {
  return (
    <div>
      <h1 className={`text-3xl font-bold tracking-tight ${variant === "page" ? "text-gray-900" : "text-gray-800"}`}>
        {children}
      </h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  )
}
