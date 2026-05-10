import { Copy, MessageCircle, Twitter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { sectionsAPI, stopsAPI, tripActivitiesAPI, tripsAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function PublicTripPage() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    tripsAPI.getPublic(slug).then((response) => setTrip(response.data.trip)).catch(() => setTrip(null));
    document.title = `${slug} · Traveloop`;
  }, [slug]);

  useEffect(() => {
    if (!trip) return;
    const setMeta = (property, content) => {
      let tag = document.querySelector(`meta[property='${property}']`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    setMeta("og:title", trip.name || "Traveloop itinerary");
    setMeta("og:description", trip.description || "A shared Traveloop itinerary.");
    setMeta("og:image", trip.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80");
  }, [trip]);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  const sectionsByDate = useMemo(() => {
    return (trip?.sections || []).reduce((groups, section) => {
      const key = section.date_from;
      groups[key] = [...(groups[key] || []), section];
      return groups;
    }, {});
  }, [trip]);
  const dates = Object.keys(sectionsByDate).sort();

  const copyTrip = async () => {
    if (!trip) return;
    try {
      const response = await tripsAPI.create({
        name: `${trip.name} copy`,
        description: trip.description,
        start_date: trip.start_date,
        end_date: trip.end_date,
        total_budget: trip.total_budget,
        is_public: false,
        cover_photo_url: trip.cover_photo_url,
      });
      const newTrip = response.data.trip;
      const stopMap = {};
      const orderedStops = [...(trip.stops || [])].sort((a, b) => a.order_index - b.order_index);
      for (const stop of orderedStops) {
        const stopResponse = await stopsAPI.create(newTrip.id, {
          city_name: stop.city_name,
          country: stop.country,
          arrival_date: stop.arrival_date,
          departure_date: stop.departure_date,
        });
        stopMap[stop.id] = stopResponse.data.stop.id;
      }
      for (const section of trip.sections || []) {
        await sectionsAPI.create(newTrip.id, {
          stop_id: section.stop_id ? stopMap[section.stop_id] : null,
          title: section.title,
          description: section.description,
          section_type: section.section_type,
          date_from: section.date_from,
          date_to: section.date_to,
          budget_estimate: section.budget_estimate,
        });
      }
      for (const activity of trip.trip_activities || []) {
        await tripActivitiesAPI.add(newTrip.id, {
          stop_id: activity.stop_id ? stopMap[activity.stop_id] : null,
          activity_id: activity.activity_id,
          scheduled_date: activity.scheduled_date,
          actual_cost: activity.actual_cost,
          notes: activity.notes,
        });
      }
      showToast("success", "Trip copied to your account");
    } catch (error) {
      showToast("error", error.response?.data?.error || "Unable to copy trip");
    }
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
            {dates.map((date, index) => (
              <article className="traveloop-card p-5" key={date}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay">Day {index + 1} · {formatDate(date)}</p>
                <div className="mt-4 space-y-3">
                  {sectionsByDate[date].map((section) => (
                    <div className="border-l-2 border-traveloop-sand pl-4" key={section.id}>
                      <p className="font-semibold">{section.title}</p>
                      <p className="text-sm text-traveloop-muted">{section.description}</p>
                      <p className="text-xs text-traveloop-muted">{section.section_type} · {formatCurrency(section.budget_estimate || 0)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <aside className="traveloop-card h-fit p-5">
            <h2 className="font-semibold">Share</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Button icon={<Copy size={16} />} onClick={copy} variant="secondary">Copy link</Button>
              <a className="traveloop-button-secondary" href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`} rel="noreferrer" target="_blank"><MessageCircle size={16} className="mr-2" /> WhatsApp</a>
              <a className="traveloop-button-secondary" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this Traveloop plan: ${window.location.href}`)}`} rel="noreferrer" target="_blank"><Twitter size={16} className="mr-2" /> Twitter</a>
              {user ? (
                <Button onClick={copyTrip} variant="primary">Copy this trip plan</Button>
              ) : (
                <Link className="traveloop-button-primary" to="/register">Join Traveloop</Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
