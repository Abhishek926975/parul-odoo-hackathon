import { Calendar, Copy, List, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function ItineraryViewPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip } = useTrips();
  const { showToast } = useToast();
  const [mode, setMode] = useState("list");

  useEffect(() => {
    fetchTrip(id).catch(() => showToast("error", "Unable to load itinerary view"));
  }, [fetchTrip, id, showToast]);

  const trip = currentTrip?.id === id ? currentTrip : null;
  const sectionsByDate = useMemo(() => {
    return (trip?.sections || []).reduce((groups, section) => {
      const key = section.date_from;
      groups[key] = [...(groups[key] || []), section];
      return groups;
    }, {});
  }, [trip]);
  const dates = Object.keys(sectionsByDate).sort();

  const share = async () => {
    if (!trip?.is_public) {
      showToast("warning", "Make the trip public before sharing");
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/share/${trip.public_slug}`);
    showToast("success", "Public link copied");
  };

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Itinerary view"
          title={trip?.name || "Itinerary"}
          description="A read-only view for reviewing, printing, and sharing the full plan."
          action={
            <div className="flex gap-2">
              <Button icon={<Copy size={16} />} onClick={share} variant="secondary">Share</Button>
              <Button icon={<Printer size={16} />} onClick={() => window.print()} variant="secondary">Print</Button>
            </div>
          }
        />
        <div className="mb-5 inline-flex rounded-lg border border-traveloop-border bg-white p-1">
          {[["list", List, "List View"], ["calendar", Calendar, "Calendar View"]].map(([value, Icon, label]) => (
            <button className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${mode === value ? "bg-traveloop-midnight text-white" : "text-traveloop-muted"}`} key={value} onClick={() => setMode(value)} type="button">
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        {mode === "list" ? (
          <div className="space-y-5">
            {dates.map((date, index) => {
              const dayTotal = sectionsByDate[date].reduce((sum, section) => sum + Number(section.budget_estimate || 0), 0);
              return (
                <article className="traveloop-card p-5" key={date}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay">Day {index + 1} · {formatDate(date)}</p>
                  <div className="mt-4 space-y-4">
                    {sectionsByDate[date].map((section) => (
                      <div className="grid gap-3 border-l-2 border-traveloop-sand pl-4 sm:grid-cols-[1fr_auto]" key={section.id}>
                        <div>
                          <p className="font-semibold">{section.title}</p>
                          <p className="text-sm text-traveloop-muted">{section.city_name || "Flexible stop"} · {section.description}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(section.budget_estimate || 0)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-right text-sm font-semibold">Day total: {formatCurrency(dayTotal)}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="traveloop-card grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-7">
            {dates.map((date) => (
              <div className="rounded-lg border border-traveloop-border bg-traveloop-mist/40 p-3" key={date}>
                <p className="text-sm font-semibold">{formatDate(date)}</p>
                <p className="mt-2 text-xs text-traveloop-muted">{sectionsByDate[date].length} sections</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
