"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string | React.ReactNode;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  priority?: boolean;
}

export function AppImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallback,
  objectFit = "cover",
  priority = false,
}: ImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map objectFit to Tailwind classes
  const objectFitClasses = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  };

  // If no src or error occurred, show fallback
  if (!src || error) {
    if (fallback) {
      return (
        <div
          className={cn("flex-shrink-0", className)}
          style={
            width && height
              ? {
                  width: `${width}px`,
                  height: `${height}px`,
                  minWidth: `${width}px`,
                  minHeight: `${height}px`,
                }
              : undefined
          }
        >
          {fallback}
        </div>
      );
    }
    // Default fallback emoji
    const defaultFallback = "🍔";
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0",
          className
        )}
        style={
          width && height
            ? {
                width: `${width}px`,
                height: `${height}px`,
                minWidth: `${width}px`,
                minHeight: `${height}px`,
              }
            : undefined
        }
      >
        <span className="text-4xl">{defaultFallback}</span>
      </div>
    );
  }

  // Check if className has width/height classes (w-* or h-*)
  const hasSizeClasses = className && (className.includes("w-") || className.includes("h-"));
  
  // Use regular img tag with error handling
  return (
    <div
      className={cn(
        "relative overflow-hidden flex-shrink-0",
        !hasSizeClasses && width && height && "aspect-square",
        className
      )}
      style={
        !hasSizeClasses && width && height
          ? {
              width: `${width}px`,
              height: `${height}px`,
              minWidth: `${width}px`,
              minHeight: `${height}px`,
            }
          : undefined
      }
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="animate-pulse text-gray-400 text-2xl">📷</div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          objectFitClasses[objectFit],
          "w-full h-full transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
