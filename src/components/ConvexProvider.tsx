"use client";

import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";
import { ReactNode } from "react";

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

export const ConvexProviderWrapper = ({ children }: ConvexProviderWrapperProps) => {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
};