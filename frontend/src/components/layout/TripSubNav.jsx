import { BookOpen, Boxes, ClipboardList, Map, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Overview", path: "", icon: Map },
  { label: "Itinerary", path: "itinerary", icon: ClipboardList },
  { label: "Budget", path: "budget", icon: Wallet },
  { label: "Packing", path: "packing", icon: Boxes },
  { label: "Notes", path: "notes", icon: BookOpen },
];

export default function TripSubNav({ tripId }) {
  return (
    <nav className="no-print sticky top-[73px] z-10 mb-6 overflow-x-auto border-b border-traveloop-border bg-white/95 px-1 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-2 px-3 sm:px-5 lg:px-7">
        {tabs.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            end={path === ""}
            to={`/trips/${tripId}${path ? `/${path}` : ""}`}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                isActive
                  ? "bg-traveloop-sand/15 text-traveloop-sand-dark"
                  : "text-traveloop-muted hover:bg-traveloop-mist hover:text-traveloop-midnight"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
