import { ChevronDown, ChevronUp, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { packingAPI } from "../services/api";
import { packingCategories } from "../utils/constants";

export default function PackingPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "clothing" });
  const [modal, setModal] = useState(false);
  const [inlineDrafts, setInlineDrafts] = useState({});
  const [collapsed, setCollapsed] = useState({});

  const suggestions = {
    clothing: ["Light jacket", "Walking shoes", "Swimwear"],
    documents: ["Passport", "Boarding pass", "Travel insurance"],
    electronics: ["Phone charger", "Power bank", "Headphones"],
    toiletries: ["Sunscreen", "Toothbrush", "Hand sanitizer"],
    other: ["Snacks", "Notebook", "Reusable bottle"],
  };

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

  const addInlineItem = async (category) => {
    const name = inlineDrafts[category];
    if (!name) return;
    await packingAPI.create(id, { name, category });
    setInlineDrafts((current) => ({ ...current, [category]: "" }));
    await load();
    showToast("success", "Packing item added");
  };

  const addSuggestion = async (category, name) => {
    await packingAPI.create(id, { name, category });
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
          action={<div className="flex gap-2"><Button icon={<Printer size={16} />} onClick={() => window.print()} variant="secondary">Print</Button><Button icon={<RotateCcw size={16} />} onClick={async () => { await packingAPI.reset(id); await load(); }} variant="secondary">Reset</Button><Button icon={<Plus size={16} />} onClick={() => setModal(true)}>Add item</Button></div>}
        />
        <div className="mb-6 h-3 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-traveloop-success" style={{ width: `${items.length ? (packed / items.length) * 100 : 0}%` }} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {packingCategories.map((category) => (
            <section className="traveloop-card p-5" key={category}>
              <div className="flex items-center justify-between">
                <h2 className="capitalize font-semibold">{category} · {grouped[category].filter((item) => item.is_packed).length}/{grouped[category].length}</h2>
                <button
                  className="rounded-md border border-traveloop-border p-1 text-traveloop-muted hover:bg-traveloop-mist"
                  onClick={() => setCollapsed((current) => ({ ...current, [category]: !current[category] }))}
                  type="button"
                >
                  {collapsed[category] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
              {!collapsed[category] ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(suggestions[category] || []).map((suggestion) => (
                      <button
                        className="rounded-full border border-traveloop-border px-3 py-1 text-xs font-semibold text-traveloop-muted hover:bg-traveloop-mist"
                        key={suggestion}
                        onClick={() => addSuggestion(category, suggestion)}
                        type="button"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {grouped[category].map((item) => (
                      <div className="flex items-center gap-3 rounded-lg border border-traveloop-border p-3" key={item.id}>
                        <input checked={item.is_packed} className="h-5 w-5" onChange={async () => { await packingAPI.toggle(id, item.id, { is_packed: !item.is_packed }); await load(); }} type="checkbox" />
                        <span className={`flex-1 ${item.is_packed ? "text-traveloop-muted line-through" : ""}`}>{item.name}</span>
                        <Button icon={<Trash2 size={16} />} onClick={async () => { await packingAPI.remove(id, item.id); await load(); }} variant="ghost" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      className="traveloop-input"
                      placeholder={`Add ${category} item`}
                      value={inlineDrafts[category] || ""}
                      onChange={(event) => setInlineDrafts((current) => ({ ...current, [category]: event.target.value }))}
                    />
                    <Button icon={<Plus size={16} />} onClick={() => addInlineItem(category)} variant="secondary">Add</Button>
                  </div>
                </>
              ) : null}
            </section>
          ))}
        </div>
      </div>
      <Modal open={modal} title="Add packing item" onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={(event) => { addItem(event); setModal(false); }}>
          <input className="traveloop-input" required placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <select className="traveloop-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {packingCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <Button type="submit">Add item</Button>
        </form>
      </Modal>
    </>
  );
}
