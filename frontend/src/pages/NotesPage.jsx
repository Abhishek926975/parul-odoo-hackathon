import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { notesAPI } from "../services/api";
import { formatDate } from "../utils/formatters";
import { useTrips } from "../hooks/useTrips";

export default function NotesPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip } = useTrips();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", stop_id: "", note_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const [tripResponse, notesResponse] = await Promise.all([fetchTrip(id), notesAPI.getAll(id)]);
    setNotes(notesResponse.data.notes || []);
    return tripResponse;
  };

  useEffect(() => {
    load().catch(() => showToast("error", "Unable to load notes"));
  }, [id]);

  const saveNote = async (event) => {
    event.preventDefault();
    await notesAPI.create(id, { ...form, stop_id: form.stop_id || null });
    showToast("success", "Note saved");
    setModal(false);
    setForm({ title: "", content: "", stop_id: "", note_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const visibleNotes = notes.filter((note) => filter === "all" || (filter === "stop" && note.stop_id) || (filter === "day" && note.note_date));

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Notes"
          title={`${currentTrip?.name || "Trip"} journal`}
          description="Capture decisions, confirmation details, and small moments you do not want to lose."
          action={<Button icon={<Plus size={16} />} onClick={() => setModal(true)}>Add note</Button>}
        />
        <div className="mb-5 inline-flex rounded-lg border border-traveloop-border bg-white p-1">
          {[["all", "All"], ["day", "By Day"], ["stop", "By Stop"]].map(([value, label]) => (
            <button className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === value ? "bg-traveloop-midnight text-white" : "text-traveloop-muted"}`} key={value} onClick={() => setFilter(value)} type="button">{label}</button>
          ))}
        </div>
        <div className="space-y-4">
          {visibleNotes.map((note) => (
            <article className="traveloop-card p-5" key={note.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{note.title || "Untitled note"}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-traveloop-muted">{note.content}</p>
                  <p className="mt-3 text-xs text-traveloop-muted">{formatDate(note.note_date)} {note.city_name ? `· ${note.city_name}` : ""}</p>
                </div>
                <Button icon={<Trash2 size={16} />} onClick={async () => { await notesAPI.remove(id, note.id); await load(); }} variant="ghost" />
              </div>
            </article>
          ))}
        </div>
      </div>
      <Modal open={modal} title="Add note" onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={saveNote}>
          <input className="traveloop-input" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea autoFocus className="traveloop-input" required rows="7" placeholder="Write the note..." value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="traveloop-input" value={form.stop_id} onChange={(event) => setForm({ ...form, stop_id: event.target.value })}>
              <option value="">No stop</option>
              {(currentTrip?.stops || []).map((stop) => <option key={stop.id} value={stop.id}>{stop.city_name}</option>)}
            </select>
            <input className="traveloop-input" type="date" value={form.note_date} onChange={(event) => setForm({ ...form, note_date: event.target.value })} />
          </div>
          <Button type="submit">Save note</Button>
        </form>
      </Modal>
    </>
  );
}
