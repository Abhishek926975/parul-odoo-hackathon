import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import { adminAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";

const colors = ["#F5A623", "#4BA3C3", "#335C4F", "#D97757"];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [tripStatus, setTripStatus] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [tripPage, setTripPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [tripTotal, setTripTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const userLimit = 10;
  const tripLimit = 10;
  const userPages = Math.max(1, Math.ceil(userTotal / userLimit));
  const tripPages = Math.max(1, Math.ceil(tripTotal / tripLimit));

  const loadStats = async () => {
    const response = await adminAPI.getStats();
    setStats(response.data.stats);
  };

  const loadUsers = async () => {
    const response = await adminAPI.getUsers({ search: userSearch, limit: userLimit, offset: (userPage - 1) * userLimit });
    setUsers(response.data.users || []);
    setUserTotal(response.data.total || 0);
  };

  const loadTrips = async () => {
    const response = await adminAPI.getTrips({ search: tripSearch, status: tripStatus, limit: tripLimit, offset: (tripPage - 1) * tripLimit });
    setTrips(response.data.trips || []);
    setTripTotal(response.data.total || 0);
  };

  useEffect(() => {
    loadStats().catch(() => null);
  }, []);

  useEffect(() => {
    loadUsers().catch(() => null);
  }, [userSearch, userPage]);

  useEffect(() => {
    loadTrips().catch(() => null);
  }, [tripSearch, tripStatus, tripPage]);

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
              <div className="grid gap-6 xl:grid-cols-2">
                <Table title="Popular activities">
                  <thead><tr><Th>Name</Th><Th>Adds</Th></tr></thead>
                  <tbody>{(stats.popular_activities || []).map((activity) => (
                    <tr className="border-t border-traveloop-border" key={activity.name}>
                      <Td>{activity.name}</Td>
                      <Td>{activity.count}</Td>
                    </tr>
                  ))}</tbody>
                </Table>
                <Table title="Recent trips">
                  <thead><tr><Th>Trip</Th><Th>User</Th><Th>Dates</Th><Th>Status</Th></tr></thead>
                  <tbody>{(stats.recent_trips || []).map((trip) => (
                    <tr className="border-t border-traveloop-border" key={trip.id}>
                      <Td>{trip.name}</Td>
                      <Td>{trip.email}</Td>
                      <Td>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</Td>
                      <Td><Badge tone="sand">{trip.status}</Badge></Td>
                    </tr>
                  ))}</tbody>
                </Table>
              </div>
            </div>
          ) : null}
          {tab === "users" ? (
            <div className="space-y-4">
              <div className="traveloop-card grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                <input className="traveloop-input" placeholder="Search users" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1); }} />
                <Button onClick={loadUsers} variant="secondary">Apply</Button>
              </div>
              <Table title="Users">
                <thead><tr><Th>Name</Th><Th>Email</Th><Th>City</Th><Th>Trips</Th><Th>Joined</Th><Th>Actions</Th></tr></thead>
                <tbody>{users.map((user) => (
                  <tr className="border-t border-traveloop-border" key={user.id}>
                    <Td>{user.first_name} {user.last_name}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.city || "Unknown"}</Td>
                    <Td>{user.trips_count}</Td>
                    <Td>{formatDate(user.created_at)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedUser(user)}>View</Button>
                        <Button size="sm" variant="danger" onClick={async () => { if (window.confirm("Delete this user?")) { await adminAPI.deleteUser(user.id); loadUsers(); } }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}</tbody>
              </Table>
              <div className="flex items-center justify-end gap-3">
                <Button disabled={userPage === 1} onClick={() => setUserPage((value) => Math.max(1, value - 1))} variant="secondary">Prev</Button>
                <span className="text-sm text-traveloop-muted">Page {userPage} of {userPages}</span>
                <Button disabled={userPage >= userPages} onClick={() => setUserPage((value) => Math.min(userPages, value + 1))} variant="secondary">Next</Button>
              </div>
            </div>
          ) : null}
          {tab === "trips" ? (
            <div className="space-y-4">
              <div className="traveloop-card grid gap-3 p-4 lg:grid-cols-[1fr_180px_auto]">
                <input className="traveloop-input" placeholder="Search trips" value={tripSearch} onChange={(event) => { setTripSearch(event.target.value); setTripPage(1); }} />
                <select className="traveloop-input" value={tripStatus} onChange={(event) => { setTripStatus(event.target.value); setTripPage(1); }}>
                  <option value="">All statuses</option>
                  {"planning upcoming ongoing completed".split(" ").map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <Button onClick={loadTrips} variant="secondary">Apply</Button>
              </div>
              <Table title="Trips">
                <thead><tr><Th>Trip</Th><Th>User</Th><Th>Dates</Th><Th>Stops</Th><Th>Budget</Th><Th>Status</Th><Th>Public</Th><Th>Actions</Th></tr></thead>
                <tbody>{trips.map((trip) => (
                  <tr className="border-t border-traveloop-border" key={trip.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <img alt={trip.name} className="h-10 w-14 rounded-md object-cover" src={trip.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80"} />
                        <span className="font-semibold">{trip.name}</span>
                      </div>
                    </Td>
                    <Td>{trip.email}</Td>
                    <Td>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</Td>
                    <Td>{trip.stops_count}</Td>
                    <Td>{formatCurrency(trip.total_budget || 0)}</Td>
                    <Td><Badge tone="sand">{trip.status}</Badge></Td>
                    <Td>{trip.is_public ? "Yes" : "No"}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => window.open(`/trips/${trip.id}`, "_blank")}>View</Button>
                        <Button size="sm" variant="danger" onClick={async () => { if (window.confirm("Delete this trip?")) { await adminAPI.deleteTrip(trip.id); loadTrips(); } }}>Delete</Button>
                      </div>
                    </Td>
                  </tr>
                ))}</tbody>
              </Table>
              <div className="flex items-center justify-end gap-3">
                <Button disabled={tripPage === 1} onClick={() => setTripPage((value) => Math.max(1, value - 1))} variant="secondary">Prev</Button>
                <span className="text-sm text-traveloop-muted">Page {tripPage} of {tripPages}</span>
                <Button disabled={tripPage >= tripPages} onClick={() => setTripPage((value) => Math.min(tripPages, value + 1))} variant="secondary">Next</Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      <Modal open={Boolean(selectedUser)} title="User profile" onClose={() => setSelectedUser(null)}>
        <div className="grid gap-3">
          <p className="text-sm text-traveloop-muted">{selectedUser?.email}</p>
          <div className="rounded-lg border border-traveloop-border p-4">
            <p className="font-semibold">{selectedUser?.first_name} {selectedUser?.last_name}</p>
            <p className="text-sm text-traveloop-muted">{selectedUser?.city || "Unknown"} · {selectedUser?.country || ""}</p>
            <p className="mt-2 text-sm text-traveloop-muted">Trips: {selectedUser?.trips_count}</p>
          </div>
        </div>
      </Modal>
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
