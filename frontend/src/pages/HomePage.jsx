import {
  ArrowRight,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const highlights = [
  {
    icon: MapPinned,
    title: "Trips with structure",
    text: "Multi-city planning, stop ordering, and day-wise scheduling in one place.",
  },
  {
    icon: Wallet,
    title: "Budget clarity",
    text: "Track estimates, actuals, and trip-wide totals without losing the plot.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Keep plans private until you want to share them publicly.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-traveloop-midnight/10 bg-white px-4 py-2 text-sm font-medium shadow-soft">
            <Sparkles size={16} className="text-traveloop-sand" />
            Build trips that feel alive
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-traveloop-midnight sm:text-6xl">
            Traveloop keeps your next journey organized, shareable, and easy to
            enjoy.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-traveloop-midnight/70">
            Design stops, map your budget, collect packing notes, and share
            polished itineraries with a single public link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="traveloop-button-primary">
              Start planning <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link to="/dashboard" className="traveloop-button-secondary">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="traveloop-card p-6 shadow-soft lg:p-8">
          <div className="rounded-3xl bg-gradient-to-br from-traveloop-midnight to-traveloop-forest p-6 text-white shadow-soft">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Trip Snapshot
            </p>
            <h2 className="mt-4 text-2xl font-semibold">Lisbon to Seville</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
              6 days, 2 cities, 1 rail transfer, nightly budget checks, and a
              public share link ready for friends.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Route", "Budget", "Packing"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm font-medium text-white/70">{item}</p>
                  <p className="mt-1 text-lg font-semibold">Ready</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article key={title} className="traveloop-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-traveloop-mist text-traveloop-midnight">
                <Icon size={20} />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-traveloop-midnight/70">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
