import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-4xl items-center gap-8 px-4 text-center lg:grid-cols-[1.1fr_.9fr] lg:text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-traveloop-clay">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-traveloop-midnight">
          You have drifted off the map
        </h1>
        <p className="mt-4 text-sm leading-6 text-traveloop-midnight/70">
          The page you are looking for does not exist. Use the compass to navigate back to your dashboard.
        </p>
        <Link to="/" className="traveloop-button-primary mt-8 inline-flex">
          Go home
        </Link>
      </div>
      <div className="flex items-center justify-center">
        <div className="traveloop-404-orbit">
          <div className="traveloop-404-planet" />
          <div className="traveloop-404-compass" />
        </div>
      </div>
    </div>
  );
}
