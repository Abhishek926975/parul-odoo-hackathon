import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-traveloop-clay">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-traveloop-midnight">
        Page not found
      </h1>
      <p className="mt-4 text-sm leading-6 text-traveloop-midnight/70">
        The route you opened does not exist in this scaffold.
      </p>
      <Link to="/" className="traveloop-button-primary mt-8">
        Go home
      </Link>
    </div>
  );
}
