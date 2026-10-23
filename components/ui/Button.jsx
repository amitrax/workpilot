import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm",
  ghost: "hover:bg-gray-100 text-gray-600",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

/**
 * Reusable Button component
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
