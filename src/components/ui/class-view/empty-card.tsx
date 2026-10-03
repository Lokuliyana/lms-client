import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HiLockClosed } from "react-icons/hi2";
import { Button } from "@/components/ui/button";

interface EmptyCardProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  illustration?: string;
  actionText?: string;
  onActionClick?: () => void;
  actionHref?: string;
}

export function EmptyCard({
  title,
  message,
  icon = <HiLockClosed className="w-8 h-8 text-slate-400" />,
  illustration,
  actionText,
  onActionClick,
  actionHref,
}: EmptyCardProps) {
  return (
    <div className="border border-slate-200/80 rounded-2xl bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        {illustration ? (
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <Image
              src={illustration}
              alt={title}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>

      {(actionText && (onActionClick || actionHref)) && (
        <div className="shrink-0 w-full sm:w-auto">
          {actionHref ? (
            <Button variant="primary" size="sm" asChild className="w-full sm:w-auto">
              <Link href={actionHref}>{actionText}</Link>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onActionClick}
              className="w-full sm:w-auto"
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
