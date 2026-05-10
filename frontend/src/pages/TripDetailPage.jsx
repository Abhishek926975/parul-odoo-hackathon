import { CalendarDays, Globe2, Share2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function TripDetailPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip, isLoading, updateTrip } = useTrips();
  const { showToast } = useToast();

  useEffect(() => {
    fetchTrip(id).catch(() => showToast("error", "Unable to load trip"));
  }, [fetchTrip, id, showToast]);

  if (isLoading && !currentTrip) {
    return <div className="mx-auto max-w-7xl px-4 py-12"><SkeletonLoader rows={4} /></div>;
  }

  const trip = currentTrip?.id === id ? currentTrip : null;

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Trip overview"
          title={trip?.name || "Trip"}
          description={trip?.description || "Plan stops, itinerary sections, expenses, packing, and notes from here."}
          action={<Link className="traveloop-button-primary" to={`/trips/${id}/itinerary`}>Open itinerary</Link>}
        />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <article className="traveloop-card overflow-hidden">
            <img
              alt={trip?.name || "Trip cover"}
              className="h-64 w-full object-cover"
              src={trip?.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"}
            />
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="sand">{trip?.status || "planning"}</Badge>
                {trip?.is_public ? <Badge tone="forest">Public</Badge> : <Badge>Private</Badge>}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-traveloop-mist p-4">
                  <CalendarDays size={18} />
                  <p className="mt-2 text-sm text-traveloop-muted">Dates</p>
                  <p className="font-semibold">{formatDate(trip?.start_date)} - {formatDate(trip?.end_date)}</p>
                </div>
                <div className="rounded-lg bg-traveloop-mist p-4">
                  <Globe2 size={18} />
                  <p className="mt-2 text-sm text-traveloop-muted">Stops</p>
                  <p className="font-semibold">{trip?.stops?.length || 0} cities</p>
                </div>
                <div className="rounded-lg bg-traveloop-mist p-4">
                  <Share2 size={18} />
                  <p className="mt-2 text-sm text-traveloop-muted">Budget</p>
                  <p className="font-semibold">{formatCurrency(trip?.total_budget || 0)}</p>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="traveloop-card p-5">
              <h3 className="font-semibold text-traveloop-midnight">Share status</h3>
              <p className="mt-2 text-sm leading-6 text-traveloop-muted">
                {trip?.is_public ? `Public link: /share/${trip.public_slug}` : "This trip is private. Turn on sharing to publish a read-only itinerary link."}
              </p>
              <Button
                className="mt-4 w-full"
                onClick={async () => {
                  await updateTrip(id, { is_public: !trip?.is_public });
                  await fetchTrip(id);
                  showToast("success", trip?.is_public ? "Trip made private" : "Public link enabled");
                }}
                variant="secondary"
              >
                {trip?.is_public ? "Make private" : "Enable sharing"}
              </Button>
            </div>
            <div className="traveloop-card p-5">
              <h3 className="font-semibold text-traveloop-midnight">Stops</h3>
              <div className="mt-3 space-y-2">
                {(trip?.stops || []).map((stop) => (
                  <div className="rounded-lg border border-traveloop-border p-3" key={stop.id}>
                    <p className="font-semibold">{stop.city_name}</p>
                    <p className="text-xs text-traveloop-muted">{formatDate(stop.arrival_date)} - {formatDate(stop.departure_date)}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
