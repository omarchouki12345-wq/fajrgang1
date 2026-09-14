import { ReactNode } from "react";

interface IconCircleProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function IconCircle({
  children,
  className = "",
  size = "md",
}: IconCircleProps) {
  return (
    <span className={`icon-circle icon-circle-${size} ${className}`}>
      {children}
    </span>
  );
}
