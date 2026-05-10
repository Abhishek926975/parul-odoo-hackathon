import { ArrowRight, Boxes, Map, PlaneTakeoff, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTrips } from "../hooks/useTrips";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import TripCard from "../components/TripCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { daysBetween } from "../utils/formatters";

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, cities } = useTrips();
  const days = trips.reduce((total, trip) => total + daysBetween(trip.start_date, trip.end_date), 0);
  const visitedCities = trips.reduce((total, trip) => total + Number(trip.stops_count || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg bg-traveloop-midnight shadow-card">
        <div className="grid lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-6 text-white sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-sand">Dashboard</p>
            <h1 className="mt-4 font-display text-4xl font-semibold">
              Welcome back, {user?.first_name || user?.firstName || "Traveler"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Where are you heading next? Build a trip, add stops, track the budget, and share the finished plan when it is ready.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="traveloop-button-primary" to="/trips/new">
                <PlaneTakeoff size={16} className="mr-2" /> Plan New Trip
              </Link>
              <Link className="traveloop-button-secondary bg-white/10 text-white hover:bg-white/20" to="/search/cities">
                Explore cities
              </Link>
            </div>
          </div>
          <img
            alt="Luggage and city map on a table"
            className="h-64 w-full object-cover lg:h-full"
            src="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1100&q=80"
          />
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-4">
        <StatCard label="Trips" value={trips.length} hint="Planned in Traveloop" tone="midnight" />
        <StatCard label="Cities" value={visitedCities} hint="Across saved routes" tone="sand" />
        <StatCard label="Travel days" value={days} hint="On your calendar" tone="sea" />
        <StatCard label="Public" value={trips.filter((trip) => trip.is_public).length} hint="Shared itineraries" tone="forest" />
      </div>

      <SectionHeader
        eyebrow="Regional Picks"
        title="Top regional selections"
        description="Featured cities from the seeded catalog, ready to become stops in a trip."
        action={<Link className="traveloop-button-secondary" to="/search/cities">View all <ArrowRight size={16} className="ml-2" /></Link>}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cities.slice(0, 4).map((city) => (
          <article className="traveloop-card overflow-hidden" key={city.id || `${city.name}-${city.country}`}>
            <img alt={city.name} className="h-36 w-full object-cover" src={`${city.image_url}?auto=format&fit=crop&w=700&q=80`} />
            <div className="p-4">
              <h3 className="font-semibold text-traveloop-midnight">{city.name}, {city.country}</h3>
              <p className="mt-1 text-sm text-traveloop-muted">Cost {city.cost_index}/10 · Popularity {city.popularity_score}/10</p>
              <Link className="mt-4 inline-flex text-sm font-semibold text-traveloop-sand-dark" to={`/search/cities?search=${encodeURIComponent(city.name)}`}>Explore</Link>
            </div>
          </article>
        ))}
      </div>

      <SectionHeader eyebrow="Recent Trips" title="Your active plans" description="The latest trips in your account." />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {trips.length > 0 ? (
          trips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} />)
        ) : (
          <EmptyState title="No trips yet" description="Start with a few dates and one destination. The itinerary, budget, packing, and notes pages will grow from there." action={<Link className="traveloop-button-primary" to="/trips/new">Plan your first trip</Link>} />
        )}
      </div>

      <SectionHeader eyebrow="Shortcuts" title="Quick actions" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/trips/new", "Plan a Trip", PlaneTakeoff],
          ["/search/cities", "Search Cities", Search],
          ["/community", "View Community", Users],
          [trips[0] ? `/trips/${trips[0].id}/packing` : "/trips", "Packing Lists", Boxes],
        ].map(([to, label, Icon]) => (
          <Link className="traveloop-card flex items-center gap-3 p-4 font-semibold hover:border-traveloop-sand" key={label} to={to}>
            <Icon className="text-traveloop-sand-dark" size={20} />
            {label}
          </Link>
        ))}
      </div>

      <Link className="traveloop-button-primary fixed bottom-24 right-4 z-20 shadow-soft lg:hidden" to="/trips/new">
        <Map size={18} />
      </Link>
    </div>
  );
}
