const tones = {
  sand: "bg-traveloop-sand/15 text-traveloop-sand-dark",
  sea: "bg-traveloop-sea/15 text-traveloop-midnight",
  forest: "bg-traveloop-forest/15 text-traveloop-forest",
  danger: "bg-traveloop-danger/10 text-traveloop-danger",
  neutral: "bg-traveloop-mist text-traveloop-muted",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
