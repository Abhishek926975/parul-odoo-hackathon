import { Bike, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { activitiesAPI, tripActivitiesAPI } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const categories = ["", "sightseeing", "food", "adventure", "shopping", "culture", "nature"];

export default function ActivitySearchPage() {
  const { trips } = useTrips();
  const { showToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", max_cost: "" });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [form, setForm] = useState({ tripId: "", scheduled_date: "" });

  const searchActivities = async () => {
    const response = await activitiesAPI.search(filters);
    setActivities(response.data.activities || []);
  };

  useEffect(() => {
    searchActivities().catch(() => showToast("error", "Unable to search activities"));
  }, []);

  const addToTrip = async (event) => {
    event.preventDefault();
    await tripActivitiesAPI.add(form.tripId, {
      activity_id: selectedActivity.id,
      scheduled_date: form.scheduled_date || null,
      actual_cost: selectedActivity.estimated_cost,
    });
    showToast("success", "Activity added to trip");
    setSelectedActivity(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Activity search" title="Add things to do" description="Search by city, category, cost, and duration, then save activities into a trip." />
      <div className="traveloop-card mb-6 grid gap-3 p-4 lg:grid-cols-[1fr_180px_160px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-traveloop-muted" size={18} />
          <input className="traveloop-input pl-10" placeholder="Search activity or city" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <select className="traveloop-input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          {categories.map((category) => <option key={category || "all"} value={category}>{category || "All categories"}</option>)}
        </select>
        <input className="traveloop-input" min="0" placeholder="Max cost" type="number" value={filters.max_cost} onChange={(event) => setFilters({ ...filters, max_cost: event.target.value })} />
        <Button onClick={searchActivities}>Search</Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <article className="traveloop-card p-5" key={activity.id}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-traveloop-mist text-traveloop-midnight"><Bike size={20} /></div>
            <div className="mt-4 flex items-center gap-2"><Badge tone="sea">{activity.category}</Badge><span className="text-sm text-traveloop-muted">{activity.city}</span></div>
            <h3 className="mt-3 text-lg font-semibold">{activity.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-traveloop-muted">{activity.description}</p>
            <p className="mt-4 text-sm font-semibold">{formatCurrency(activity.estimated_cost)} · {activity.duration_hours}h · {(3.5 + (activity.name.length % 15) / 10).toFixed(1)} stars</p>
            <Button className="mt-4 w-full" disabled={!trips.length} icon={<Plus size={16} />} onClick={() => { setSelectedActivity(activity); setForm({ tripId: trips[0]?.id || "", scheduled_date: "" }); }}>
              Add to trip
            </Button>
          </article>
        ))}
      </div>
      <Modal open={Boolean(selectedActivity)} title={`Add ${selectedActivity?.name || "activity"}`} onClose={() => setSelectedActivity(null)}>
        <form className="grid gap-4" onSubmit={addToTrip}>
          <select className="traveloop-input" required value={form.tripId} onChange={(event) => setForm({ ...form, tripId: event.target.value })}>
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
          <input className="traveloop-input" type="date" value={form.scheduled_date} onChange={(event) => setForm({ ...form, scheduled_date: event.target.value })} />
          <Button type="submit">Add activity</Button>
        </form>
      </Modal>
    </div>
  );
}
