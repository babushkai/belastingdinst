import { forwardRef } from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center font-medium disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "border border-black bg-black text-white hover:bg-white hover:text-black",
  secondary:
    "border border-black bg-white text-black hover:bg-black hover:text-white",
  danger:
    "border border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white",
  ghost:
    "border border-transparent text-black hover:border-black",
} as const;

const sizes = {
  sm: "px-2 py-1 text-xs gap-1",
  md: "px-3 py-2 text-sm gap-1.5",
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
      className={`${base} ${variants[variant]} ${sizes[size]} ${className} no-underline`}
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
