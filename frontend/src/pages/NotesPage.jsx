import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { notesAPI } from "../services/api";
import { formatDate } from "../utils/formatters";
import { useTrips } from "../hooks/useTrips";

export default function NotesPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip } = useTrips();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", stop_id: "", note_date: "" });
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
    setDrawerOpen(false);
    setForm({ title: "", content: "", stop_id: "", note_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditForm({
      title: note.title || "",
      content: note.content || "",
      stop_id: note.stop_id || "",
      note_date: note.note_date || new Date().toISOString().slice(0, 10),
    });
  };

  const saveEdit = async (noteId) => {
    await notesAPI.update(id, noteId, { ...editForm, stop_id: editForm.stop_id || null });
    setEditingId(null);
    showToast("success", "Note updated");
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
          action={<Button icon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>Add note</Button>}
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
                  {editingId === note.id ? (
                    <div className="mt-3 grid gap-3">
                      <input className="traveloop-input" placeholder="Title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
                      <textarea className="traveloop-input" rows="5" value={editForm.content} onChange={(event) => setEditForm({ ...editForm, content: event.target.value })} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select className="traveloop-input" value={editForm.stop_id} onChange={(event) => setEditForm({ ...editForm, stop_id: event.target.value })}>
                          <option value="">No stop</option>
                          {(currentTrip?.stops || []).map((stop) => <option key={stop.id} value={stop.id}>{stop.city_name}</option>)}
                        </select>
                        <input className="traveloop-input" type="date" value={editForm.note_date} onChange={(event) => setEditForm({ ...editForm, note_date: event.target.value })} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`mt-2 text-sm leading-6 text-traveloop-muted ${expandedId === note.id ? "" : "line-clamp-3"}`}>{note.content}</p>
                      {expandedId === note.id ? null : (
                        <button className="mt-2 text-xs font-semibold text-traveloop-sand-dark" onClick={() => setExpandedId(note.id)} type="button">Read more</button>
                      )}
                    </>
                  )}
                  <p className="mt-3 text-xs text-traveloop-muted">{formatDate(note.note_date)} {note.city_name ? `· ${note.city_name}` : ""}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {editingId === note.id ? (
                    <>
                      <Button icon={<Check size={16} />} onClick={() => saveEdit(note.id)} variant="secondary" />
                      <Button icon={<X size={16} />} onClick={() => setEditingId(null)} variant="ghost" />
                    </>
                  ) : (
                    <>
                      <Button icon={expandedId === note.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />} onClick={() => setExpandedId(expandedId === note.id ? null : note.id)} variant="ghost" />
                      <Button icon={<Pencil size={16} />} onClick={() => startEdit(note)} variant="ghost" />
                      <Button icon={<Trash2 size={16} />} onClick={async () => { await notesAPI.remove(id, note.id); await load(); }} variant="ghost" />
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className={`fixed inset-0 z-40 bg-black/40 transition ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setDrawerOpen(false)} />
      <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl transition-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-traveloop-border px-5 py-4">
          <h2 className="text-lg font-semibold">Add note</h2>
          <Button icon={<X size={16} />} onClick={() => setDrawerOpen(false)} variant="ghost" />
        </div>
        <form className="grid gap-4 p-5" onSubmit={saveNote}>
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
      </div>
    </>
  );
}
