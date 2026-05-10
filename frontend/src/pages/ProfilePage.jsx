import { Camera, Save } from "lucide-react";
import { useState } from "react";
import SectionHeader from "../components/SectionHeader";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useTrips } from "../hooks/useTrips";
import { authAPI } from "../services/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { trips } = useTrips();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    phoneNumber: user?.phone_number || "",
    city: user?.city || "",
    country: user?.country || "",
    additionalInfo: user?.additional_info || "",
    language: "English",
  });

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
            <p className="mt-1 text-sm text-red-800">Account deletion is intentionally held for a confirmed backend admin flow.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
