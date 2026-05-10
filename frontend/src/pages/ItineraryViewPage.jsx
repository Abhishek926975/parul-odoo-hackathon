import { BedDouble, Calendar, Copy, List, MapPin, Plane, Printer, Sparkles, Utensils } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState("");

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
  const grandTotal = dates.reduce(
    (sum, date) => sum + sectionsByDate[date].reduce((daySum, section) => daySum + Number(section.budget_estimate || 0), 0),
    0,
  );

  useEffect(() => {
    if (!selectedDate && dates.length) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  const sectionIcon = (type) => {
    const icons = {
      hotel: BedDouble,
      transport: Plane,
      activity: MapPin,
      food: Utensils,
      other: Sparkles,
    };
    const Icon = icons[type] || Sparkles;
    return <Icon size={16} />;
  };

  const calendarDays = useMemo(() => {
    const baseDate = trip?.start_date || dates[0];
    if (!baseDate) return [];
    const start = new Date(baseDate);
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const startOffset = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const cells = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ key: `empty-${i}`, date: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), day);
      const iso = date.toISOString().slice(0, 10);
      cells.push({ key: iso, date: iso, day });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `empty-tail-${cells.length}`, date: null });
    }

    return cells;
  }, [dates, trip]);

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
              <Button icon={<Printer size={16} />} onClick={() => window.print()} variant="secondary">Export</Button>
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
                          <p className="flex items-center gap-2 font-semibold">
                            <span className="text-traveloop-sand-dark">{sectionIcon(section.section_type)}</span>
                            {section.title}
                          </p>
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
            <div className="flex justify-end text-sm font-semibold">Grand total: {formatCurrency(grandTotal)}</div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
            <div className="traveloop-card p-4">
              <div className="mb-3 grid grid-cols-7 text-xs font-semibold uppercase text-traveloop-muted">
                {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((label) => (
                  <div className="px-2 py-1" key={label}>{label}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell) => (
                  <button
                    className={`min-h-[76px] rounded-lg border border-traveloop-border p-2 text-left ${cell.date === selectedDate ? "bg-traveloop-sand/15" : "bg-white"}`}
                    disabled={!cell.date}
                    key={cell.key}
                    onClick={() => cell.date && setSelectedDate(cell.date)}
                    type="button"
                  >
                    {cell.date ? (
                      <>
                        <p className="text-sm font-semibold">{cell.day}</p>
                        {sectionsByDate[cell.date]?.length ? (
                          <p className="mt-2 text-xs text-traveloop-muted">{sectionsByDate[cell.date].length} items</p>
                        ) : (
                          <p className="mt-2 text-xs text-traveloop-muted">No plans</p>
                        )}
                      </>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <aside className="traveloop-card h-fit p-5">
              <h3 className="font-semibold">{selectedDate ? formatDate(selectedDate) : "Select a date"}</h3>
              <div className="mt-4 space-y-3">
                {(sectionsByDate[selectedDate] || []).map((section) => (
                  <div className="rounded-lg border border-traveloop-border p-3" key={section.id}>
                    <p className="flex items-center gap-2 text-sm font-semibold">{sectionIcon(section.section_type)} {section.title}</p>
                    <p className="mt-1 text-xs text-traveloop-muted">{section.description}</p>
                  </div>
                ))}
                {!sectionsByDate[selectedDate]?.length ? (
                  <p className="text-sm text-traveloop-muted">No itinerary items for this day.</p>
                ) : null}
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
