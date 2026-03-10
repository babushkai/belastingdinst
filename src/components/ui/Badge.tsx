const variants = {
  default: "text-black",
  primary: "text-[#0000cc]",
  success: "text-green-700",
  warning: "text-amber-700",
  danger: "text-red-700",
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`text-xs font-mono ${variants[variant]} ${className}`}
    >
      [{children}]
    </span>
  );
}
