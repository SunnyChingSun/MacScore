"use client";

import React from "react";
import { getScoreColor, getScoreBadge } from "@/lib/services/scoring";
import { cn } from "@/lib/utils";

interface ScoreMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreMeter({
  score,
  size = "md",
  showLabel = true,
  className,
}: ScoreMeterProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (score / 100) * circumference;

  const colorClass = getScoreColor(score);
  const badge = getScoreBadge(score);

  // Determine gradient color based on score
  let gradientColor = "from-macscore-red via-macscore-gold to-macscore-green";
  if (score >= 70) {
    gradientColor = "from-macscore-green to-macscore-green";
  } else if (score >= 50) {
    gradientColor = "from-macscore-gold to-macscore-green";
  } else {
    gradientColor = "from-macscore-red to-macscore-gold";
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          className="transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Score circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E63946" />
              <stop offset="50%" stopColor="#F4A261" />
              <stop offset="100%" stopColor="#2A9D8F" />
            </linearGradient>
          </defs>
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", textSizes[size], colorClass)}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="mt-2 text-center">
          <p className={cn("text-sm font-medium", colorClass)}>{badge}</p>
          <p className="text-xs text-gray-500 mt-1">MacScore</p>
        </div>
      )}
    </div>
  );
}
