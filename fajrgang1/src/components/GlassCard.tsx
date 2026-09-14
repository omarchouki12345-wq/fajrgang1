import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({ children, className = "", hover = false }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 ${hover ? "glass-card-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
