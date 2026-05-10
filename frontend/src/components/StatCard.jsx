export default function StatCard({ label, value, hint, tone = "midnight" }) {
  const toneClasses = {
    midnight: "bg-traveloop-midnight text-white",
    sand: "bg-traveloop-sand text-white",
    sea: "bg-traveloop-sea text-white",
    forest: "bg-traveloop-forest text-white",
  };

  return (
    <div
      className={`rounded-lg p-5 shadow-card ${toneClasses[tone] || toneClasses.midnight}`}
    >
      <p className="text-sm/6 opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-sm opacity-80">{hint}</p> : null}
    </div>
  );
}
