"use client";

import React from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "bg-red-50 border border-red-200 rounded-lg p-4 text-center",
        className
      )}
    >
      <div className="text-red-800 mb-2">
        <p className="font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

