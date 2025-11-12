"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message,
  className,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg",
        className
      )}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">⚠️</span>
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-red-600 hover:text-red-800 underline text-sm"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
