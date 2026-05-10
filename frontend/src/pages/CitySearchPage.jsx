import { ChevronLeft, ChevronRight, MapPin, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";
import { citiesAPI, stopsAPI } from "../services/api";

export default function CitySearchPage() {
  const { trips } = useTrips();
  const { showToast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const [cities, setCities] = useState([]);
  const [query, setQuery] = useState(params.get("search") || "");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("popularity");
  const [selectedCity, setSelectedCity] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [availableStops, setAvailableStops] = useState([]);
  const [form, setForm] = useState({ tripId: "", afterStopId: "", arrival_date: "", departure_date: "" });
  const limit = 12;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const searchCities = async () => {
    const response = await citiesAPI.search({ search: query, region, sort, limit, offset: (page - 1) * limit });
    setCities(response.data.cities || []);
    setTotal(response.data.total || 0);
  };

  useEffect(() => {
    searchCities().catch(() => showToast("error", "Unable to search cities"));
  }, [page]);

  const addToTrip = async (event) => {
    event.preventDefault();
    const response = await stopsAPI.create(form.tripId, {
      city_name: selectedCity.name,
      country: selectedCity.country,
      arrival_date: form.arrival_date,
      departure_date: form.departure_date,
    });
    const newStop = response.data.stop;
    if (form.afterStopId) {
      const stopResponse = await stopsAPI.getAll(form.tripId);
      const orderedStops = (stopResponse.data.stops || []).sort((a, b) => a.order_index - b.order_index);
      const filteredStops = orderedStops.filter((stop) => stop.id !== newStop.id);
      const insertIndex = filteredStops.findIndex((stop) => stop.id === form.afterStopId);
      if (insertIndex >= 0) {
        filteredStops.splice(insertIndex + 1, 0, newStop);
        await Promise.all(
          filteredStops.map((stop, index) => stopsAPI.update(form.tripId, stop.id, { order_index: index })),
        );
      }
    }
    showToast("success", `${selectedCity.name} added to trip`);
    setSelectedCity(null);
  };

  const openModal = async (city) => {
    const defaultTripId = trips[0]?.id || "";
    setSelectedCity(city);
    setForm((current) => ({ ...current, tripId: defaultTripId, afterStopId: "" }));
    if (defaultTripId) {
      const stopResponse = await stopsAPI.getAll(defaultTripId);
      setAvailableStops(stopResponse.data.stops || []);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="City search" title="Find your next stop" description="Filter seeded city data by region, popularity, and relative cost." />
      <div className="traveloop-card mb-6 grid gap-3 p-4 lg:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-traveloop-muted" size={18} />
          <input className="traveloop-input pl-10" placeholder="Search city or country" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select className="traveloop-input" value={region} onChange={(event) => setRegion(event.target.value)}>
          <option value="">All regions</option>
          {["Asia", "Europe", "Americas", "Africa", "Oceania"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="traveloop-input" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="popularity">Popularity</option>
          <option value="cost">Cost low to high</option>
          <option value="cost_desc">Cost high to low</option>
        </select>
        <Button onClick={() => { setPage(1); searchCities(); }}>Search</Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.map((city) => (
          <article className="traveloop-card overflow-hidden" key={city.id}>
            <img alt={city.name} className="h-40 w-full object-cover" src={`${city.image_url}?auto=format&fit=crop&w=700&q=80`} />
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-traveloop-clay"><MapPin size={12} /> {city.region}</div>
              <h3 className="mt-2 text-lg font-semibold">{city.name}, {city.country}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-traveloop-muted">{city.description}</p>
              <p className="mt-3 text-sm text-traveloop-muted">Cost {city.cost_index}/10 · Popularity {city.popularity_score}/10</p>
              <Button className="mt-4 w-full" disabled={!trips.length} icon={<Plus size={16} />} onClick={() => openModal(city)}>
                Add to trip
              </Button>
            </div>
          </article>
        ))}
      </div>
      <Modal open={Boolean(selectedCity)} title={`Add ${selectedCity?.name || "city"} to trip`} onClose={() => setSelectedCity(null)}>
        <form className="grid gap-4" onSubmit={addToTrip}>
          <select
            className="traveloop-input"
            required
            value={form.tripId}
            onChange={async (event) => {
              const tripId = event.target.value;
              setForm({ ...form, tripId, afterStopId: "" });
              if (tripId) {
                const stopResponse = await stopsAPI.getAll(tripId);
                setAvailableStops(stopResponse.data.stops || []);
              }
            }}
          >
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
          <select className="traveloop-input" value={form.afterStopId} onChange={(event) => setForm({ ...form, afterStopId: event.target.value })}>
            <option value="">Add to end</option>
            {availableStops.map((stop) => <option key={stop.id} value={stop.id}>After {stop.city_name}</option>)}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="traveloop-input" required type="date" value={form.arrival_date} onChange={(event) => setForm({ ...form, arrival_date: event.target.value })} />
            <input className="traveloop-input" required type="date" value={form.departure_date} onChange={(event) => setForm({ ...form, departure_date: event.target.value })} />
          </div>
          <Button type="submit">Add stop</Button>
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
