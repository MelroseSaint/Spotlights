"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFileUrl } from "@/hooks/api";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-32 h-32",
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-4xl",
};

export function UserAvatar({ src, name, size = "md", className = "" }: UserAvatarProps) {
  const avatarUrl = useFileUrl(src ?? null);
  
  return (
    <Avatar className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <AvatarImage src={avatarUrl ?? undefined} alt={name} />
      <AvatarFallback className={`bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold ${fallbackSizeClasses[size]}`}>
        {name?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}