export default function SkeletonLoader({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-white/80 shadow-card" />
      ))}
    </div>
  );
}
