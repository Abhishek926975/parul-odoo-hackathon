export default function Card({ children, className = "" }) {
  return <div className={`traveloop-card ${className}`}>{children}</div>;
}
