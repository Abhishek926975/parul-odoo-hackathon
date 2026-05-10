import { Bike, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { activitiesAPI, stopsAPI, tripActivitiesAPI } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const categories = ["", "sightseeing", "food", "adventure", "shopping", "culture", "nature"];

export default function ActivitySearchPage() {
  const { trips } = useTrips();
  const { showToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", max_cost: "", min_duration: "", max_duration: "" });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [form, setForm] = useState({ tripId: "", stopId: "", scheduled_date: "" });
  const [availableStops, setAvailableStops] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const searchActivities = async () => {
    const response = await activitiesAPI.search({ ...filters, limit, offset: (page - 1) * limit });
    setActivities(response.data.activities || []);
    setTotal(response.data.total || 0);
  };

  useEffect(() => {
    searchActivities().catch(() => showToast("error", "Unable to search activities"));
  }, [page]);

  const addToTrip = async (event) => {
    event.preventDefault();
    await tripActivitiesAPI.add(form.tripId, {
      activity_id: selectedActivity.id,
      stop_id: form.stopId || null,
      scheduled_date: form.scheduled_date || null,
      actual_cost: selectedActivity.estimated_cost,
    });
    showToast("success", "Activity added to trip");
    setSelectedActivity(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Activity search" title="Add things to do" description="Search by city, category, cost, and duration, then save activities into a trip." />
      <div className="traveloop-card mb-6 grid gap-3 p-4 lg:grid-cols-[1fr_160px_140px_140px_140px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-traveloop-muted" size={18} />
          <input className="traveloop-input pl-10" placeholder="Search activity or city" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <select className="traveloop-input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          {categories.map((category) => <option key={category || "all"} value={category}>{category || "All categories"}</option>)}
        </select>
        <input className="traveloop-input" min="0" placeholder="Max cost" type="number" value={filters.max_cost} onChange={(event) => setFilters({ ...filters, max_cost: event.target.value })} />
        <input className="traveloop-input" min="0" placeholder="Min hours" type="number" value={filters.min_duration} onChange={(event) => setFilters({ ...filters, min_duration: event.target.value })} />
        <input className="traveloop-input" min="0" placeholder="Max hours" type="number" value={filters.max_duration} onChange={(event) => setFilters({ ...filters, max_duration: event.target.value })} />
        <Button onClick={() => { setPage(1); searchActivities(); }}>Search</Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <article className="traveloop-card p-5" key={activity.id}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-traveloop-mist text-traveloop-midnight"><Bike size={20} /></div>
            <div className="mt-4 flex items-center gap-2"><Badge tone="sea">{activity.category}</Badge><span className="text-sm text-traveloop-muted">{activity.city}</span></div>
            <h3 className="mt-3 text-lg font-semibold">{activity.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-traveloop-muted">{activity.description}</p>
            <p className="mt-4 text-sm font-semibold">{formatCurrency(activity.estimated_cost)} · {activity.duration_hours}h · {(3.5 + (activity.name.length % 15) / 10).toFixed(1)} stars</p>
            <Button className="mt-4 w-full" disabled={!trips.length} icon={<Plus size={16} />} onClick={async () => {
              const tripId = trips[0]?.id || "";
              setSelectedActivity(activity);
              setForm({ tripId, stopId: "", scheduled_date: "" });
              if (tripId) {
                const stopResponse = await stopsAPI.getAll(tripId);
                setAvailableStops(stopResponse.data.stops || []);
              }
            }}>
              Add to trip
            </Button>
          </article>
        ))}
      </div>
      <Modal open={Boolean(selectedActivity)} title={`Add ${selectedActivity?.name || "activity"}`} onClose={() => setSelectedActivity(null)}>
        <form className="grid gap-4" onSubmit={addToTrip}>
          <select
            className="traveloop-input"
            required
            value={form.tripId}
            onChange={async (event) => {
              const tripId = event.target.value;
              setForm({ ...form, tripId, stopId: "" });
              if (tripId) {
                const stopResponse = await stopsAPI.getAll(tripId);
                setAvailableStops(stopResponse.data.stops || []);
              }
            }}
          >
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
          <select className="traveloop-input" value={form.stopId} onChange={(event) => setForm({ ...form, stopId: event.target.value })}>
            <option value="">No stop</option>
            {availableStops.map((stop) => <option key={stop.id} value={stop.id}>{stop.city_name}</option>)}
          </select>
          <input className="traveloop-input" type="date" value={form.scheduled_date} onChange={(event) => setForm({ ...form, scheduled_date: event.target.value })} />
          <Button type="submit">Add activity</Button>
        </form>
      </Modal>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button disabled={page === 1} icon={<ChevronLeft size={16} />} onClick={() => setPage((value) => Math.max(1, value - 1))} variant="secondary">Prev</Button>
        <span className="text-sm text-traveloop-muted">Page {page} of {totalPages}</span>
        <Button disabled={page >= totalPages} icon={<ChevronRight size={16} />} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} variant="secondary">Next</Button>
      </div>
    </div>
  );
}
