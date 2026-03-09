import { forwardRef } from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "rounded-lg bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700 hover:shadow-lg",
  secondary:
    "rounded-lg border border-surface-300 bg-white text-surface-700 shadow-sm hover:bg-surface-50 hover:text-surface-900",
  danger:
    "rounded-lg bg-red-600 text-white shadow-md shadow-red-600/25 hover:bg-red-700",
  ghost:
    "rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

interface LinkButtonProps {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
