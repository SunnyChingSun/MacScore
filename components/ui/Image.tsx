"use client";

import React, { useState } from "react";

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

  // If no src or error occurred, show fallback
  if (!src || error) {
    if (fallback) {
      return (
        <div
          className={className}
          style={width && height ? { width, height, minWidth: width, minHeight: height } : undefined}
        >
          {fallback}
        </div>
      );
    }
    // Default fallback emoji
    const defaultFallback = "🍔";
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={width && height ? { width, height, minWidth: width, minHeight: height } : undefined}
      >
        <span className="text-4xl">{defaultFallback}</span>
      </div>
    );
  }

  // Use regular img tag with error handling
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={width && height ? { width, height, minWidth: width, minHeight: height } : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-pulse text-gray-400 text-2xl">📷</div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-${objectFit} w-full h-full transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
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
