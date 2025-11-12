import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-macscore-red text-white hover:bg-red-600",
    secondary: "bg-macscore-gold text-white hover:bg-yellow-500",
    success: "bg-macscore-green text-white hover:bg-teal-600",
    ghost: "bg-transparent border border-gray-300 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
