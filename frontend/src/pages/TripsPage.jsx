import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripCard from "../components/TripCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { tripStatusLabels, tripStatuses } from "../utils/constants";

export default function TripsPage() {
  const { trips, deleteTrip } = useTrips();
  const { showToast } = useToast();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [groupBy, setGroupBy] = useState("status");

  const visibleTrips = useMemo(() => {
    return trips
      .filter((trip) => status === "all" || trip.status === status)
      .filter((trip) => trip.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [trips, status, search, sort]);

  const handleDelete = async (trip) => {
    if (!window.confirm(`Delete "${trip.name}"?`)) return;
    await deleteTrip(trip.id);
    showToast("success", "Trip deleted");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Trips"
        title="Plan every stop"
        description="Filter, sort, create, and open trip plans from one focused workspace."
        action={
          <Link className="traveloop-button-primary" to="/trips/new">
            <Plus size={16} className="mr-2" /> New trip
          </Link>
        }
      />

      <div className="traveloop-card mb-6 grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-traveloop-muted" size={18} />
          <input className="traveloop-input pl-10" placeholder="Search trips" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select className="traveloop-input" value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
          <option value="status">Group by status</option>
          <option value="none">No grouping</option>
        </select>
        <select className="traveloop-input" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A-Z</option>
        </select>
        <Button icon={<Filter size={16} />} variant="secondary">Filters</Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...tripStatuses].map((item) => (
          <button
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              status === item ? "bg-traveloop-midnight text-white" : "bg-white text-traveloop-muted hover:text-traveloop-midnight"
            }`}
            key={item}
            onClick={() => setStatus(item)}
            type="button"
          >
            {item === "all" ? "All" : tripStatusLabels[item]}
          </button>
        ))}
      </div>

      {visibleTrips.length > 0 ? (
        groupBy === "status" ? (
          <div className="space-y-6">
            {tripStatuses.map((group) => {
              const groupTrips = visibleTrips.filter((trip) => trip.status === group);
              if (!groupTrips.length) return null;
              return (
                <section key={group}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-traveloop-clay">{group}</h3>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {groupTrips.map((trip) => <TripCard key={trip.id} onDelete={handleDelete} trip={trip} />)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleTrips.map((trip) => <TripCard key={trip.id} onDelete={handleDelete} trip={trip} />)}
          </div>
        )
      ) : (
        <div className="md:col-span-2 xl:col-span-3">
          <EmptyState title="No trips to show" description="Create your first trip or clear the current filters." action={<Link className="traveloop-button-primary" to="/trips/new">Plan your first trip</Link>} />
        </div>
      )}
    </div>
  );
}
