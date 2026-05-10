import { Camera, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useTrips } from "../hooks/useTrips";
import { authAPI } from "../services/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { trips } = useTrips();
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [form, setForm] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    phoneNumber: user?.phone_number || "",
    city: user?.city || "",
    country: user?.country || "",
    additionalInfo: user?.additional_info || "",
    language: "English",
  });

  const upcomingTrips = useMemo(
    () => trips.filter((trip) => ["planning", "upcoming"].includes(trip.status)).slice(0, 3),
    [trips],
  );
  const completedTrips = useMemo(
    () => trips.filter((trip) => trip.status === "completed").slice(0, 3),
    [trips],
  );

  const save = async (event) => {
    event.preventDefault();
    await updateUser(form);
    showToast("success", "Profile updated");
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    await authAPI.uploadPhoto(formData);
    showToast("success", "Profile photo uploaded");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Profile" title="Traveler settings" description="Update personal details used across your trip plans." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="traveloop-card h-fit p-6 text-center">
          <label className="mx-auto flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-traveloop-mist text-traveloop-midnight">
            {user?.profile_photo_url ? <img alt="Profile" className="h-full w-full object-cover" src={user.profile_photo_url} /> : <Camera size={28} />}
            <input className="hidden" type="file" accept="image/*" onChange={upload} />
          </label>
          <h2 className="mt-4 text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
          <p className="text-sm text-traveloop-muted">{user?.email}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div><p className="font-semibold">{trips.length}</p><p className="text-xs text-traveloop-muted">Trips</p></div>
            <div><p className="font-semibold">{trips.reduce((sum, trip) => sum + Number(trip.stops_count || 0), 0)}</p><p className="text-xs text-traveloop-muted">Cities</p></div>
            <div><p className="font-semibold">{trips.filter((trip) => trip.status === "completed").length}</p><p className="text-xs text-traveloop-muted">Done</p></div>
          </div>
          <div className="mt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-traveloop-clay">Pre-planned trips</p>
            <div className="mt-3 grid gap-3">
              {upcomingTrips.map((trip) => (
                <div className="flex items-center gap-3" key={trip.id}>
                  <img alt={trip.name} className="h-12 w-16 rounded-lg object-cover" src={trip.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80"} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{trip.name}</p>
                    <Button className="mt-1" size="sm" variant="secondary" onClick={() => window.location.assign(`/trips/${trip.id}`)}>View</Button>
                  </div>
                </div>
              ))}
              {!upcomingTrips.length ? <p className="text-xs text-traveloop-muted">No upcoming trips yet.</p> : null}
            </div>
          </div>
          <div className="mt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-traveloop-clay">Previous trips</p>
            <div className="mt-3 grid gap-3">
              {completedTrips.map((trip) => (
                <div className="flex items-center gap-3" key={trip.id}>
                  <img alt={trip.name} className="h-12 w-16 rounded-lg object-cover" src={trip.cover_photo_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80"} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{trip.name}</p>
                    <Button className="mt-1" size="sm" variant="secondary" onClick={() => window.location.assign(`/trips/${trip.id}`)}>View</Button>
                  </div>
                </div>
              ))}
              {!completedTrips.length ? <p className="text-xs text-traveloop-muted">No completed trips yet.</p> : null}
            </div>
          </div>
        </aside>
        <form className="traveloop-card grid gap-4 p-6 sm:grid-cols-2" onSubmit={save}>
          <input className="traveloop-input" required placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <input className="traveloop-input" required placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <input className="traveloop-input bg-traveloop-mist" readOnly value={user?.email || ""} />
          <input className="traveloop-input" placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
          <input className="traveloop-input" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <input className="traveloop-input" placeholder="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          <select className="traveloop-input" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>
            {["English", "Hindi", "Spanish", "French"].map((language) => <option key={language}>{language}</option>)}
          </select>
          <textarea className="traveloop-input sm:col-span-2" rows="4" placeholder="Additional info" value={form.additionalInfo} onChange={(event) => setForm({ ...form, additionalInfo: event.target.value })} />
          <div className="sm:col-span-2">
            <Button icon={<Save size={16} />} type="submit">Save profile</Button>
          </div>
          <div className="rounded-lg border border-traveloop-danger/20 bg-red-50 p-4 sm:col-span-2">
            <p className="font-semibold text-red-900">Danger zone</p>
            <p className="mt-1 text-sm text-red-800">Deleting your account removes all trips, notes, and saved plans.</p>
            <Button className="mt-3" icon={<Trash2 size={16} />} onClick={() => setDeleteModal(true)} variant="danger">Delete account</Button>
          </div>
        </form>
      </div>
      <Modal open={deleteModal} title="Delete account" onClose={() => setDeleteModal(false)}>
        <div className="grid gap-4">
          <p className="text-sm text-traveloop-muted">Type DELETE to confirm account removal.</p>
          <input className="traveloop-input" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} />
          <Button
            disabled={deleteConfirm !== "DELETE"}
            onClick={() => {
              showToast("error", "Account deletion is not enabled in this build");
              setDeleteModal(false);
              setDeleteConfirm("");
            }}
            variant="danger"
          >
            Confirm delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
