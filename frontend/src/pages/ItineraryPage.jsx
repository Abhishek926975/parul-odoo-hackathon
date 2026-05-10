import { BedDouble, ChevronDown, ChevronUp, MapPin, Pencil, Plane, Plus, Search, Sparkles, Trash2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { activitiesAPI, citiesAPI, sectionsAPI, stopsAPI, tripActivitiesAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { sectionTypes } from "../utils/constants";
import { useTrips } from "../hooks/useTrips";

export default function ItineraryPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip, isLoading } = useTrips();
  const { showToast } = useToast();
  const [selectedStopId, setSelectedStopId] = useState("");
  const [stopModal, setStopModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityResults, setActivityResults] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [stopForm, setStopForm] = useState({ city_name: "", country: "", arrival_date: "", departure_date: "" });
  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
    section_type: "activity",
    date_from: "",
    date_to: "",
    budget_estimate: "",
  });

  useEffect(() => {
    fetchTrip(id).then((response) => {
      const firstStop = response.data.trip.stops?.[0]?.id;
      if (firstStop) setSelectedStopId(firstStop);
    }).catch(() => showToast("error", "Unable to load itinerary"));
  }, [fetchTrip, id, showToast]);

  const trip = currentTrip?.id === id ? currentTrip : null;
  const stops = trip?.stops || [];
  const orderedStops = useMemo(
    () => [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || new Date(a.arrival_date) - new Date(b.arrival_date)),
    [stops],
  );
  const selectedStop = orderedStops.find((stop) => stop.id === selectedStopId) || orderedStops[0];
  const sectionsByStop = useMemo(() => {
    return (trip?.sections || []).reduce((acc, section) => {
      const key = section.stop_id || "unassigned";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [trip]);
  const sections = useMemo(
    () => (trip?.sections || []).filter((section) => !selectedStop || section.stop_id === selectedStop.id),
    [trip, selectedStop],
  );
  const tripActivities = useMemo(
    () => (trip?.trip_activities || []).filter((activity) => !selectedStop || activity.stop_id === selectedStop.id),
    [trip, selectedStop],
  );

  const refresh = () => fetchTrip(id);

  const addStop = async (event) => {
    event.preventDefault();
    await stopsAPI.create(id, stopForm);
    showToast("success", "Stop added");
    setStopModal(false);
    setStopForm({ city_name: "", country: "", arrival_date: "", departure_date: "" });
    await refresh();
  };

  const addSection = async (event) => {
    event.preventDefault();
    const payload = {
      ...sectionForm,
      stop_id: selectedStop?.id || null,
      date_to: sectionForm.date_to || sectionForm.date_from,
      budget_estimate: sectionForm.budget_estimate || null,
    };
    if (editingSection) {
      await sectionsAPI.update(id, editingSection.id, payload);
      showToast("success", "Section updated");
    } else {
      await sectionsAPI.create(id, payload);
      showToast("success", "Section added");
    }
    setSectionModal(false);
    setEditingSection(null);
    setSectionForm({ title: "", description: "", section_type: "activity", date_from: "", date_to: "", budget_estimate: "" });
    await refresh();
  };

  const searchActivities = async () => {
    const response = await activitiesAPI.search({ search: activitySearch, city: selectedStop?.city_name || "" });
    setActivityResults(response.data.activities || []);
  };

  const addActivity = async (activity) => {
    await tripActivitiesAPI.add(id, {
      activity_id: activity.id,
      stop_id: selectedStop?.id || null,
      scheduled_date: selectedStop?.arrival_date || null,
      actual_cost: activity.estimated_cost,
    });
    showToast("success", "Activity added to trip");
    await refresh();
  };

  const removeActivity = async (activityId) => {
    await tripActivitiesAPI.remove(id, activityId);
    showToast("success", "Activity removed");
    await refresh();
  };

  const searchCities = async () => {
    const response = await citiesAPI.search({ search: citySearch, limit: 6 });
    setCityResults(response.data.cities || []);
  };

  const moveStop = async (stopId, direction) => {
    const index = orderedStops.findIndex((stop) => stop.id === stopId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= orderedStops.length) return;
    const current = orderedStops[index];
    const target = orderedStops[targetIndex];

    await Promise.all([
      stopsAPI.update(id, current.id, { order_index: target.order_index ?? targetIndex }),
      stopsAPI.update(id, target.id, { order_index: current.order_index ?? index }),
    ]);
    await refresh();
  };

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

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Itinerary builder"
          title={trip?.name || "Build itinerary"}
          description="Add trip stops, attach sections, and save activities against the selected city."
          action={<Link className="traveloop-button-secondary" to={`/trips/${id}/itinerary/view`}>View itinerary</Link>}
        />

        {isLoading && !trip ? <SkeletonLoader rows={4} /> : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="traveloop-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Stops</h2>
              <Button icon={<Plus size={16} />} onClick={() => setStopModal(true)} size="sm">Add</Button>
            </div>
            <div className="space-y-2">
              {orderedStops.map((stop, index) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left ${selectedStop?.id === stop.id ? "border-traveloop-sand bg-traveloop-sand/10" : "border-traveloop-border bg-white"}`}
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{stop.city_name}</p>
                      <p className="text-xs text-traveloop-muted">{formatDate(stop.arrival_date)} - {formatDate(stop.departure_date)}</p>
                      <p className="mt-1 text-xs text-traveloop-muted">{sectionsByStop[stop.id] || 0} sections</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        className="rounded-md border border-traveloop-border p-1 text-traveloop-muted hover:bg-traveloop-mist"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveStop(stop.id, -1);
                        }}
                        type="button"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="rounded-md border border-traveloop-border p-1 text-traveloop-muted hover:bg-traveloop-mist"
                        disabled={index === orderedStops.length - 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveStop(stop.id, 1);
                        }}
                        type="button"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        className="rounded-md border border-traveloop-border p-1 text-traveloop-muted hover:bg-traveloop-mist"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (window.confirm(`Delete ${stop.city_name}?`)) {
                            stopsAPI.remove(id, stop.id).then(refresh);
                          }
                        }}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
              {!stops.length ? <EmptyState title="No stops yet" description="Add the first city to start building day plans." /> : null}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="traveloop-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-traveloop-muted">Selected stop</p>
                  <h2 className="text-xl font-semibold">{selectedStop?.city_name || "Choose a stop"}</h2>
                </div>
                <Button disabled={!selectedStop} icon={<Plus size={16} />} onClick={() => setSectionModal(true)}>Add section</Button>
              </div>
              <div className="mt-5 space-y-3">
                {sections.map((section) => (
                  <article className="rounded-lg border border-traveloop-border p-4" key={section.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay">
                          {sectionIcon(section.section_type)} {section.section_type}
                        </p>
                        <h3 className="mt-1 font-semibold text-traveloop-midnight">{section.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-traveloop-muted">{section.description}</p>
                        <p className="mt-2 text-xs text-traveloop-muted">{formatDate(section.date_from)} - {formatDate(section.date_to)} · {formatCurrency(section.budget_estimate || 0)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          icon={<Pencil size={16} />}
                          onClick={() => {
                            setEditingSection(section);
                            setSectionForm({
                              title: section.title,
                              description: section.description || "",
                              section_type: section.section_type,
                              date_from: section.date_from,
                              date_to: section.date_to,
                              budget_estimate: section.budget_estimate || "",
                            });
                            setSectionModal(true);
                          }}
                          variant="ghost"
                        />
                        <Button icon={<Trash2 size={16} />} onClick={async () => {
                          await sectionsAPI.remove(id, section.id);
                          showToast("success", "Section deleted");
                          await refresh();
                        }} variant="ghost" />
                      </div>
                    </div>
                  </article>
                ))}
                {selectedStop && !sections.length ? <EmptyState title="No sections for this stop" description="Add hotel, transport, food, or activity blocks." /> : null}
              </div>
            </div>

            <div className="traveloop-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">Add activities</h2>
                <div className="flex gap-2">
                  <input className="traveloop-input" placeholder="Search activities" value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} />
                  <Button icon={<Search size={16} />} onClick={searchActivities} variant="secondary">Search</Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activityResults.map((activity) => (
                  <div className="rounded-lg border border-traveloop-border p-4" key={activity.id}>
                    <h3 className="font-semibold">{activity.name}</h3>
                    <p className="mt-1 text-sm text-traveloop-muted">{activity.city} · {formatCurrency(activity.estimated_cost)}</p>
                    <Button className="mt-3" onClick={() => addActivity(activity)} size="sm">Add to trip</Button>
                  </div>
                ))}
                {!activityResults.length ? <EmptyState title="No activities yet" description="Search by keyword or city to add activities." /> : null}
              </div>
              <div className="mt-6">
                <h3 className="font-semibold">Saved activities</h3>
                <div className="mt-3 space-y-2">
                  {tripActivities.map((activity) => (
                    <div className="flex items-center justify-between rounded-lg border border-traveloop-border p-3" key={activity.id}>
                      <div>
                        <p className="font-semibold">{activity.name}</p>
                        <p className="text-xs text-traveloop-muted">{activity.city} · {formatCurrency(activity.actual_cost || activity.estimated_cost)}</p>
                      </div>
                      <Button icon={<Trash2 size={16} />} onClick={() => removeActivity(activity.id)} variant="ghost" />
                    </div>
                  ))}
                  {!tripActivities.length ? <p className="text-sm text-traveloop-muted">No activities saved for this stop yet.</p> : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Modal open={stopModal} title="Add stop" onClose={() => setStopModal(false)}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={addStop}>
          <label className="sm:col-span-2">
            <span className="traveloop-label">Search city</span>
            <div className="flex gap-2">
              <input className="traveloop-input" placeholder="Search cities" value={citySearch} onChange={(event) => setCitySearch(event.target.value)} />
              <Button icon={<Search size={16} />} onClick={searchCities} type="button" variant="secondary">Search</Button>
            </div>
          </label>
          <div className="sm:col-span-2 grid gap-2">
            {cityResults.map((city) => (
              <button
                className="flex w-full items-center justify-between rounded-lg border border-traveloop-border px-3 py-2 text-left hover:bg-traveloop-mist"
                key={city.id}
                onClick={() => setStopForm({ ...stopForm, city_name: city.name, country: city.country })}
                type="button"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-xs text-traveloop-muted">{city.country}</span>
              </button>
            ))}
            {!cityResults.length ? <p className="text-xs text-traveloop-muted">Search to see city suggestions.</p> : null}
          </div>
          <input className="traveloop-input" required placeholder="City" value={stopForm.city_name} onChange={(event) => setStopForm({ ...stopForm, city_name: event.target.value })} />
          <input className="traveloop-input" placeholder="Country" value={stopForm.country} onChange={(event) => setStopForm({ ...stopForm, country: event.target.value })} />
          <input className="traveloop-input" required type="date" value={stopForm.arrival_date} onChange={(event) => setStopForm({ ...stopForm, arrival_date: event.target.value })} />
          <input className="traveloop-input" required type="date" value={stopForm.departure_date} onChange={(event) => setStopForm({ ...stopForm, departure_date: event.target.value })} />
          <Button className="sm:col-span-2" type="submit">Add stop</Button>
        </form>
      </Modal>
      <Modal open={sectionModal} title={editingSection ? "Edit itinerary section" : "Add itinerary section"} onClose={() => { setSectionModal(false); setEditingSection(null); }}>
        <form className="grid gap-4" onSubmit={addSection}>
          <select className="traveloop-input" value={sectionForm.section_type} onChange={(event) => setSectionForm({ ...sectionForm, section_type: event.target.value })}>
            {sectionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input className="traveloop-input" required placeholder="Title" value={sectionForm.title} onChange={(event) => setSectionForm({ ...sectionForm, title: event.target.value })} />
          <textarea className="traveloop-input" rows="3" placeholder="Description" value={sectionForm.description} onChange={(event) => setSectionForm({ ...sectionForm, description: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="traveloop-input" required type="date" value={sectionForm.date_from} onChange={(event) => setSectionForm({ ...sectionForm, date_from: event.target.value })} />
            <input className="traveloop-input" type="date" value={sectionForm.date_to} onChange={(event) => setSectionForm({ ...sectionForm, date_to: event.target.value })} />
            <input className="traveloop-input" min="0" placeholder="Budget" type="number" value={sectionForm.budget_estimate} onChange={(event) => setSectionForm({ ...sectionForm, budget_estimate: event.target.value })} />
          </div>
          <Button type="submit">Save section</Button>
        </form>
      </Modal>
    </>
  );
}
