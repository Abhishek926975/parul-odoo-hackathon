import { Check, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Cell, Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import TripSubNav from "../components/layout/TripSubNav";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { expensesAPI } from "../services/api";
import { expenseCategories } from "../utils/constants";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useTrips } from "../hooks/useTrips";

const colors = ["#F5A623", "#4BA3C3", "#335C4F", "#D97757", "#2C3E50", "#10B981", "#EF4444"];

export default function BudgetPage() {
  const { id } = useParams();
  const { currentTrip, fetchTrip } = useTrips();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, by_category: [], by_day: [], daily_avg: 0 });
  const [modal, setModal] = useState(false);
  const [locked, setLocked] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "expense_date", direction: "desc" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ category: "food", description: "", amount: "", qty: 1, expense_date: "" });
  const [form, setForm] = useState({ category: "food", description: "", amount: "", qty: 1, expense_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const [tripResponse, expenseResponse] = await Promise.all([fetchTrip(id), expensesAPI.getAll(id)]);
    setExpenses(expenseResponse.data.expenses || []);
    setSummary(expenseResponse.data.summary || {});
    return tripResponse;
  };

  useEffect(() => {
    load().catch(() => showToast("error", "Unable to load budget"));
  }, [id]);

  const trip = currentTrip?.id === id ? currentTrip : null;
  const totalBudget = Number(trip?.total_budget || 0);
  const spent = Number(summary.total || 0);
  const remaining = totalBudget - spent;
  const percent = totalBudget ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0;
  const dayData = useMemo(() => summary.by_day || [], [summary]);
  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      const valueA = key === "amount" ? Number(a.amount) : key === "qty" ? Number(a.qty) : a[key];
      const valueB = key === "amount" ? Number(b.amount) : key === "qty" ? Number(b.qty) : b[key];
      if (valueA === valueB) return 0;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      return direction === "asc" ? -1 : 1;
    });
    return sorted;
  }, [expenses, sortConfig]);
  const subtotal = spent;
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;
  const tripDays = trip?.start_date && trip?.end_date ? Math.max(1, Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000) + 1) : 0;
  const dailyBudget = tripDays && totalBudget ? totalBudget / tripDays : 0;
  const overBudgetDays = (summary.by_day || []).filter((day) => dailyBudget && day.total > dailyBudget).length;

  const saveExpense = async (event) => {
    event.preventDefault();
    await expensesAPI.create(id, form);
    showToast("success", "Expense added");
    setModal(false);
    setForm({ category: "food", description: "", amount: "", qty: 1, expense_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const updateSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      qty: expense.qty,
      expense_date: expense.expense_date,
    });
  };

  const saveEdit = async (expenseId) => {
    await expensesAPI.update(id, expenseId, editForm);
    setEditingId(null);
    showToast("success", "Expense updated");
    await load();
  };

  return (
    <>
      <TripSubNav tripId={id} />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 no-print">
        <SectionHeader
          eyebrow="Budget"
          title={`${trip?.name || "Trip"} budget`}
          description="Track spend, compare categories, and print a lightweight invoice view."
          action={<Button disabled={locked} icon={<Plus size={16} />} onClick={() => setModal(true)}>Add expense</Button>}
        />
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            ["Total Budget", totalBudget],
            ["Spent", spent],
            ["Remaining", remaining],
            ["Daily Avg", summary.daily_avg || 0],
          ].map(([label, value]) => (
            <div className="traveloop-card p-5" key={label}>
              <p className="text-sm text-traveloop-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
          <div className={`h-full ${percent > 90 ? "bg-traveloop-danger" : "bg-traveloop-sand"}`} style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="traveloop-card p-5">
                <h3 className="font-semibold">Expenses by category</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={summary.by_category || []} dataKey="total" nameKey="category" outerRadius={90}>
                        {(summary.by_category || []).map((entry, index) => <Cell fill={colors[index % colors.length]} key={entry.category} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="traveloop-card p-5">
                <h3 className="font-semibold">Daily spending</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={dayData}>
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="total" fill="#4BA3C3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="traveloop-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-traveloop-border p-5">
                <h3 className="font-semibold">Expense table</h3>
                <div className="flex gap-2">
                  <Button onClick={() => window.print()} size="sm" variant="secondary">Download invoice</Button>
                  <Button icon={<Printer size={16} />} onClick={() => window.print()} size="sm" variant="secondary">Export PDF</Button>
                  <Button onClick={() => setLocked((value) => !value)} size="sm" variant="secondary">{locked ? "Unlock" : "Mark final"}</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-traveloop-mist text-xs uppercase text-traveloop-muted">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => updateSort("category")}>Category</button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => updateSort("description")}>Description</button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => updateSort("qty")}>Qty</button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => updateSort("amount")}>Unit Cost</button>
                      </th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => updateSort("expense_date")}>Date</button>
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map((expense, index) => (
                      <tr className="border-t border-traveloop-border" key={expense.id}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 capitalize">
                          {editingId === expense.id ? (
                            <select className="traveloop-input" value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}>
                              {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                          ) : (
                            expense.category
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === expense.id ? (
                            <input className="traveloop-input" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
                          ) : (
                            expense.description
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === expense.id ? (
                            <input className="traveloop-input" min="1" type="number" value={editForm.qty} onChange={(event) => setEditForm({ ...editForm, qty: event.target.value })} />
                          ) : (
                            expense.qty
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === expense.id ? (
                            <input className="traveloop-input" min="0" type="number" value={editForm.amount} onChange={(event) => setEditForm({ ...editForm, amount: event.target.value })} />
                          ) : (
                            formatCurrency(expense.amount)
                          )}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(Number(expense.amount) * Number(expense.qty))}</td>
                        <td className="px-4 py-3">
                          {editingId === expense.id ? (
                            <input className="traveloop-input" type="date" value={editForm.expense_date} onChange={(event) => setEditForm({ ...editForm, expense_date: event.target.value })} />
                          ) : (
                            formatDate(expense.expense_date)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === expense.id ? (
                            <div className="flex gap-2">
                              <Button disabled={locked} icon={<Check size={16} />} onClick={() => saveEdit(expense.id)} variant="secondary" />
                              <Button icon={<X size={16} />} onClick={() => setEditingId(null)} variant="ghost" />
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button disabled={locked} icon={<Pencil size={16} />} onClick={() => startEdit(expense)} variant="ghost" />
                              <Button disabled={locked} icon={<Trash2 size={16} />} onClick={async () => {
                                await expensesAPI.remove(id, expense.id);
                                await load();
                              }} variant="ghost" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-traveloop-border p-5 text-sm">
                <div className="flex justify-between"><span className="text-traveloop-muted">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                <div className="mt-2 flex justify-between"><span className="text-traveloop-muted">Tax (10%)</span><span className="font-semibold">{formatCurrency(tax)}</span></div>
                <div className="mt-3 flex justify-between text-base"><span className="font-semibold">Grand total</span><span className="font-semibold">{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>
          </div>
          <aside className="traveloop-card h-fit p-5">
            <h3 className="font-semibold">Budget summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-traveloop-muted">Per-day average</dt>
                <dd className="font-semibold">{formatCurrency(summary.daily_avg || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-traveloop-muted">Days over budget</dt>
                <dd className="font-semibold">{overBudgetDays}</dd>
              </div>
              {(summary.by_category || []).map((item) => (
                <div className="flex justify-between" key={item.category}>
                  <dt className="capitalize text-traveloop-muted">{item.category}</dt>
                  <dd className="font-semibold">{formatCurrency(item.total)}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
      <div className="print-only mx-auto max-w-4xl p-10">
        <h1 className="text-2xl font-semibold">{trip?.name || "Trip"} invoice</h1>
        <p className="mt-2 text-sm text-traveloop-muted">{formatDate(trip?.start_date)} - {formatDate(trip?.end_date)}</p>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-traveloop-border">
              <th className="py-2">Category</th>
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr className="border-b border-traveloop-border" key={expense.id}>
                <td className="py-2 capitalize">{expense.category}</td>
                <td className="py-2">{expense.description}</td>
                <td className="py-2">{expense.qty}</td>
                <td className="py-2">{formatCurrency(expense.amount)}</td>
                <td className="py-2">{formatCurrency(Number(expense.amount) * Number(expense.qty))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="mt-2 flex justify-between"><span>Tax (10%)</span><span>{formatCurrency(tax)}</span></div>
          <div className="mt-3 flex justify-between text-base font-semibold"><span>Grand total</span><span>{formatCurrency(grandTotal)}</span></div>
        </div>
      </div>
      <Modal open={modal} title="Add expense" onClose={() => setModal(false)}>
        <form className="grid gap-4" onSubmit={saveExpense}>
          <select className="traveloop-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="traveloop-input" required placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="traveloop-input" required min="0" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            <input className="traveloop-input" min="1" type="number" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} />
            <input className="traveloop-input" required type="date" value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} />
          </div>
          <Button type="submit">Save expense</Button>
        </form>
      </Modal>
    </>
  );
}
