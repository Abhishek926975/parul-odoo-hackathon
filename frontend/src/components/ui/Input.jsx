export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="traveloop-label">{label}</span> : null}
      <input className="traveloop-input" {...props} />
      {error ? <span className="mt-1 block text-xs font-medium text-traveloop-danger">{error}</span> : null}
    </label>
  );
}
