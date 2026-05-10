const variants = {
  primary: "bg-traveloop-sand text-white hover:bg-traveloop-sand-dark",
  secondary: "border border-traveloop-border bg-white text-traveloop-midnight hover:border-traveloop-sand hover:text-traveloop-sand-dark",
  ghost: "text-traveloop-muted hover:bg-traveloop-mist hover:text-traveloop-midnight",
  danger: "bg-traveloop-danger text-white hover:bg-red-600",
};

const sizes = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      {children}
    </button>
  );
}
