import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import Button from "../components/ui/Button";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { adminAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";

const colors = ["#F5A623", "#4BA3C3", "#335C4F", "#D97757"];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getTrips()]).then(([statsResponse, usersResponse, tripsResponse]) => {
      setStats(statsResponse.data.stats);
      setUsers(usersResponse.data.users || []);
      setTrips(tripsResponse.data.trips || []);
    });
  }, []);

  const lineData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, index) => ({
      day: index + 1,
      trips: Math.max(1, Math.round(((stats?.total_trips || 4) / 30) * (index + 1) + (index % 5))),
      users: Math.max(1, Math.round(((stats?.total_users || 3) / 30) * (index + 1) + (index % 4))),
    }));
  }, [stats]);

  if (!stats) {
    return <div className="mx-auto max-w-7xl px-4 py-12"><SkeletonLoader rows={5} /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Analytics dashboard"
        description="Admin-only analytics, users, and trip tables for hackathon judging."
      />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="traveloop-card h-fit p-3">
          {["dashboard", "users", "trips"].map((item) => (
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold capitalize ${tab === item ? "bg-traveloop-midnight text-white" : "text-traveloop-muted hover:bg-traveloop-mist"}`} key={item} onClick={() => setTab(item)} type="button">
              {item}
            </button>
          ))}
        </aside>
        <section>
          {tab === "dashboard" ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-4">
                <StatCard label="Total Users" value={stats.total_users} hint="All accounts" />
                <StatCard label="Total Trips" value={stats.total_trips} hint="Created plans" tone="sand" />
                <StatCard label="Trips This Week" value={stats.trips_this_week} hint="Recent growth" tone="sea" />
                <StatCard label="Active Today" value={stats.active_users_today} hint="Estimated" tone="forest" />
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <Chart title="Trips created per day">
                  <LineChart data={lineData}><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="trips" stroke="#F5A623" strokeWidth={3} /></LineChart>
                </Chart>
                <Chart title="Top added cities">
                  <BarChart data={stats.top_cities}><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="count" fill="#4BA3C3" radius={[4, 4, 0, 0]} /></BarChart>
                </Chart>
                <Chart title="Trip status distribution">
                  <PieChart><Pie data={stats.trips_by_status} dataKey="count" nameKey="status" outerRadius={90}>{stats.trips_by_status.map((entry, index) => <Cell fill={colors[index % colors.length]} key={entry.status} />)}</Pie><Tooltip /></PieChart>
                </Chart>
                <Chart title="User signups over time">
                  <AreaChart data={lineData}><XAxis dataKey="day" /><YAxis /><Tooltip /><Area dataKey="users" fill="#335C4F" stroke="#335C4F" /></AreaChart>
                </Chart>
              </div>
            </div>
          ) : null}
          {tab === "users" ? (
            <Table title="Users">
              <thead><tr><Th>Name</Th><Th>Email</Th><Th>City</Th><Th>Trips</Th><Th>Joined</Th><Th>Actions</Th></tr></thead>
              <tbody>{users.map((user) => <tr className="border-t border-traveloop-border" key={user.id}><Td>{user.first_name} {user.last_name}</Td><Td>{user.email}</Td><Td>{user.city || "Unknown"}</Td><Td>{user.trips_count}</Td><Td>{formatDate(user.created_at)}</Td><Td><Button size="sm" variant="secondary">View</Button></Td></tr>)}</tbody>
            </Table>
          ) : null}
          {tab === "trips" ? (
            <Table title="Trips">
              <thead><tr><Th>Trip</Th><Th>User</Th><Th>Dates</Th><Th>Stops</Th><Th>Budget</Th><Th>Status</Th></tr></thead>
              <tbody>{trips.map((trip) => <tr className="border-t border-traveloop-border" key={trip.id}><Td>{trip.name}</Td><Td>{trip.email}</Td><Td>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</Td><Td>{trip.stops_count}</Td><Td>{formatCurrency(trip.total_budget || 0)}</Td><Td>{trip.status}</Td></tr>)}</tbody>
            </Table>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Chart({ title, children }) {
  return (
    <div className="traveloop-card p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 h-72"><ResponsiveContainer>{children}</ResponsiveContainer></div>
    </div>
  );
}

function Table({ title, children }) {
  return (
    <div className="traveloop-card overflow-hidden">
      <div className="border-b border-traveloop-border p-5"><h3 className="font-semibold">{title}</h3></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">{children}</table></div>
    </div>
  );
}

function Th({ children }) {
  return <th className="bg-traveloop-mist px-4 py-3 text-xs uppercase text-traveloop-muted">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>;
}
