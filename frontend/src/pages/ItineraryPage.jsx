import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { activitiesAPI, sectionsAPI, stopsAPI, tripActivitiesAPI } from "../services/api";
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
  const selectedStop = stops.find((stop) => stop.id === selectedStopId) || stops[0];
  const sections = useMemo(
    () => (trip?.sections || []).filter((section) => !selectedStop || section.stop_id === selectedStop.id),
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
    await sectionsAPI.create(id, {
      ...sectionForm,
      stop_id: selectedStop?.id || null,
      date_to: sectionForm.date_to || sectionForm.date_from,
      budget_estimate: sectionForm.budget_estimate || null,
    });
    showToast("success", "Section added");
    setSectionModal(false);
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
              {stops.map((stop) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left ${selectedStop?.id === stop.id ? "border-traveloop-sand bg-traveloop-sand/10" : "border-traveloop-border bg-white"}`}
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  type="button"
                >
                  <p className="font-semibold">{stop.city_name}</p>
                  <p className="text-xs text-traveloop-muted">{formatDate(stop.arrival_date)} - {formatDate(stop.departure_date)}</p>
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay">{section.section_type}</p>
                        <h3 className="mt-1 font-semibold text-traveloop-midnight">{section.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-traveloop-muted">{section.description}</p>
                        <p className="mt-2 text-xs text-traveloop-muted">{formatDate(section.date_from)} - {formatDate(section.date_to)} · {formatCurrency(section.budget_estimate || 0)}</p>
                      </div>
                      <Button icon={<Trash2 size={16} />} onClick={async () => {
                        await sectionsAPI.remove(id, section.id);
                        showToast("success", "Section deleted");
                        await refresh();
                      }} variant="ghost" />
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
              </div>
            </div>
          </section>
        </div>
      </div>
      <Modal open={stopModal} title="Add stop" onClose={() => setStopModal(false)}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={addStop}>
          <input className="traveloop-input" required placeholder="City" value={stopForm.city_name} onChange={(event) => setStopForm({ ...stopForm, city_name: event.target.value })} />
          <input className="traveloop-input" placeholder="Country" value={stopForm.country} onChange={(event) => setStopForm({ ...stopForm, country: event.target.value })} />
          <input className="traveloop-input" required type="date" value={stopForm.arrival_date} onChange={(event) => setStopForm({ ...stopForm, arrival_date: event.target.value })} />
          <input className="traveloop-input" required type="date" value={stopForm.departure_date} onChange={(event) => setStopForm({ ...stopForm, departure_date: event.target.value })} />
          <Button className="sm:col-span-2" type="submit">Add stop</Button>
        </form>
      </Modal>
      <Modal open={sectionModal} title="Add itinerary section" onClose={() => setSectionModal(false)}>
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
