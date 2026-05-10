import { MapPin, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [form, setForm] = useState({ tripId: "", arrival_date: "", departure_date: "" });

  const searchCities = async () => {
    const response = await citiesAPI.search({ search: query, region, sort, limit: 24 });
    setCities(response.data.cities || []);
  };

  useEffect(() => {
    searchCities().catch(() => showToast("error", "Unable to search cities"));
  }, []);

  const addToTrip = async (event) => {
    event.preventDefault();
    await stopsAPI.create(form.tripId, {
      city_name: selectedCity.name,
      country: selectedCity.country,
      arrival_date: form.arrival_date,
      departure_date: form.departure_date,
    });
    showToast("success", `${selectedCity.name} added to trip`);
    setSelectedCity(null);
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
        <Button onClick={searchCities}>Search</Button>
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
              <Button className="mt-4 w-full" disabled={!trips.length} icon={<Plus size={16} />} onClick={() => { setSelectedCity(city); setForm({ ...form, tripId: trips[0]?.id || "" }); }}>
                Add to trip
              </Button>
            </div>
          </article>
        ))}
      </div>
      <Modal open={Boolean(selectedCity)} title={`Add ${selectedCity?.name || "city"} to trip`} onClose={() => setSelectedCity(null)}>
        <form className="grid gap-4" onSubmit={addToTrip}>
          <select className="traveloop-input" required value={form.tripId} onChange={(event) => setForm({ ...form, tripId: event.target.value })}>
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="traveloop-input" required type="date" value={form.arrival_date} onChange={(event) => setForm({ ...form, arrival_date: event.target.value })} />
            <input className="traveloop-input" required type="date" value={form.departure_date} onChange={(event) => setForm({ ...form, departure_date: event.target.value })} />
          </div>
          <Button type="submit">Add stop</Button>
        </form>
      </Modal>
    </div>
  );
}
