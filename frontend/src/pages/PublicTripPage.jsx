import { Copy, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/ui/Button";
import { tripsAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function PublicTripPage() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    tripsAPI.getPublic(slug).then((response) => setTrip(response.data.trip)).catch(() => setTrip(null));
    document.title = `${slug} · Traveloop`;
  }, [slug]);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative min-h-[58vh] overflow-hidden">
        <img
          alt={trip?.name || "Shared trip"}
          className="absolute inset-0 h-full w-full object-cover"
          src={trip?.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=80"}
        />
        <div className="absolute inset-0 bg-traveloop-midnight/55" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end px-4 py-10 text-white sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-sand">Traveloop shared itinerary</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-semibold">{trip?.name || slug}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{formatDate(trip?.start_date)} - {formatDate(trip?.end_date)} · Shared by {trip?.owner?.first_name || "a traveler"}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Itinerary" title="Plan details" description={trip?.description || "A public read-only trip plan."} />
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {(trip?.sections || []).map((section) => (
              <article className="traveloop-card p-5" key={section.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay">{section.section_type} · {formatDate(section.date_from)}</p>
                <h3 className="mt-2 text-lg font-semibold">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-traveloop-muted">{section.description}</p>
                <p className="mt-3 text-sm font-semibold">{formatCurrency(section.budget_estimate || 0)}</p>
              </article>
            ))}
          </div>
          <aside className="traveloop-card h-fit p-5">
            <h2 className="font-semibold">Share</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Button icon={<Copy size={16} />} onClick={copy} variant="secondary">Copy link</Button>
              <a className="traveloop-button-secondary" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this Traveloop plan: ${window.location.href}`)}`} rel="noreferrer" target="_blank"><Twitter size={16} className="mr-2" /> Twitter</a>
              <Link className="traveloop-button-primary" to="/register">Join Traveloop</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
