import { CalendarDays, MapPin, ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "../utils/formatters";
import { tripStatusLabels } from "../utils/constants";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

export default function TripCard({ trip, onDelete }) {
  return (
    <article className="traveloop-card overflow-hidden">
      <div
        className="h-40 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(44,62,80,.35), rgba(245,166,35,.28)), url(${trip.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"})`,
        }}
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-traveloop-clay">
            <MapPin size={12} />
            Trip
          </div>
          <Badge tone={trip.status === "completed" ? "forest" : "sand"}>
            {tripStatusLabels[trip.status] || "Planning"}
          </Badge>
        </div>
        <h3 className="mt-3 line-clamp-1 text-xl font-semibold tracking-tight text-traveloop-midnight">
          {trip.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-traveloop-midnight/70">
          {trip.description ||
            "Plan the route, pack the details, and keep your trip moving."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-traveloop-midnight/70">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={14} />
            {formatDate(trip.start_date)}
          </span>
          <span className="inline-flex items-center gap-2">
            <ArrowRight size={14} />
            {formatDate(trip.end_date)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-traveloop-muted">
          <span>{Number(trip.stops_count || 0)} stops</span>
          <span>{trip.total_budget ? formatCurrency(trip.total_budget) : "No budget"}</span>
        </div>
        <div className="mt-5 flex gap-2">
          <Link to={`/trips/${trip.id}`} className="traveloop-button-primary flex-1">
            Open trip
          </Link>
          {onDelete ? (
            <Button aria-label={`Delete ${trip.name}`} icon={<Trash2 size={16} />} onClick={() => onDelete(trip)} variant="ghost" />
          ) : null}
        </div>
      </div>
    </article>
  );
}
