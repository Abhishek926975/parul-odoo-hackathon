import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { packingAPI } from "../services/api";
import { packingCategories } from "../utils/constants";

export default function PackingPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "clothing" });

  const load = async () => {
    const response = await packingAPI.getAll(id);
    setItems(response.data.items || []);
  };

  useEffect(() => {
    load().catch(() => showToast("error", "Unable to load packing list"));
  }, [id]);

  const packed = items.filter((item) => item.is_packed).length;
  const grouped = useMemo(() => {
    return packingCategories.reduce((groups, category) => {
      groups[category] = items.filter((item) => item.category === category);
      return groups;
    }, {});
  }, [items]);

  const addItem = async (event) => {
    event.preventDefault();
    await packingAPI.create(id, form);
    setForm({ name: "", category: form.category });
    await load();
    showToast("success", "Packing item added");
  };

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Packing"
          title={`${packed} of ${items.length} items packed`}
          description="Tap large checklist rows on mobile, print before departure, or reset everything after the trip."
          action={<div className="flex gap-2"><Button icon={<Printer size={16} />} onClick={() => window.print()} variant="secondary">Print</Button><Button icon={<RotateCcw size={16} />} onClick={async () => { await packingAPI.reset(id); await load(); }} variant="secondary">Reset</Button></div>}
        />
        <div className="mb-6 h-3 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-traveloop-success" style={{ width: `${items.length ? (packed / items.length) * 100 : 0}%` }} />
        </div>
        <form className="traveloop-card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_220px_auto]" onSubmit={addItem}>
          <input className="traveloop-input" required placeholder="Add item" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <select className="traveloop-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {packingCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <Button icon={<Plus size={16} />} type="submit">Add</Button>
        </form>
        <div className="grid gap-5 lg:grid-cols-2">
          {packingCategories.map((category) => (
            <section className="traveloop-card p-5" key={category}>
              <h2 className="capitalize font-semibold">{category} · {grouped[category].filter((item) => item.is_packed).length}/{grouped[category].length}</h2>
              <div className="mt-4 space-y-2">
                {grouped[category].map((item) => (
                  <div className="flex items-center gap-3 rounded-lg border border-traveloop-border p-3" key={item.id}>
                    <input checked={item.is_packed} className="h-5 w-5" onChange={async () => { await packingAPI.toggle(id, item.id, { is_packed: !item.is_packed }); await load(); }} type="checkbox" />
                    <span className={`flex-1 ${item.is_packed ? "text-traveloop-muted line-through" : ""}`}>{item.name}</span>
                    <Button icon={<Trash2 size={16} />} onClick={async () => { await packingAPI.remove(id, item.id); await load(); }} variant="ghost" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
