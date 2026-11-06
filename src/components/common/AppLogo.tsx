import React from "react";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "w-7 h-7 rounded-lg",
  md: "w-9 h-9 rounded-xl",
  lg: "w-12 h-12 rounded-2xl",
  xl: "w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/30",
};

export function AppLogo({ className = "", size = "md" }: AppLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden flex-shrink-0 select-none ${sizeMap[size]} ${className}`}
    >
      <img
        src="/favicon.svg"
        alt="DuoMate Logo"
        className="w-full h-full object-cover rounded-inherit"
      />
    </div>
  );
}

