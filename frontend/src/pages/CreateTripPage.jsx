import { ArrowLeft, ArrowRight, Check, ImagePlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { useTrips } from "../hooks/useTrips";

const steps = ["Basics", "Dates", "Review"];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    total_budget: "",
    is_public: false,
  });

  const canContinue = useMemo(() => {
    if (step === 0) return form.name.trim().length > 1;
    if (step === 1) return form.start_date && form.end_date && form.end_date >= form.start_date;
    return true;
  }, [form, step]);

  const update = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await createTrip({
        ...form,
        total_budget: form.total_budget || null,
      });
      showToast("success", "Trip created");
      navigate(`/trips/${response.data.trip.id}/itinerary`);
    } catch (error) {
      showToast("error", error.response?.data?.error || "Could not create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-traveloop-muted hover:text-traveloop-midnight" to="/trips">
        <ArrowLeft size={16} /> Back to trips
      </Link>
      <Card className="p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-clay">New trip</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-traveloop-midnight">Plan a trip in three steps</h1>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {steps.map((label, index) => (
              <div key={label}>
                <div className={`h-2 rounded-full ${index <= step ? "bg-traveloop-sand" : "bg-traveloop-mist"}`} />
                <p className="mt-2 text-xs font-semibold text-traveloop-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="grid gap-5">
            <Input label="Trip name" placeholder="Europe Adventure" required value={form.name} onChange={update("name")} />
            <label>
              <span className="traveloop-label">Trip description</span>
              <textarea className="traveloop-input" rows="4" placeholder="What kind of route are you building?" value={form.description} onChange={update("description")} />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-traveloop-border bg-traveloop-mist/50 px-6 py-8 text-center">
              {preview ? <img alt="Trip cover preview" className="mb-4 h-40 w-full rounded-lg object-cover" src={preview} /> : <ImagePlus className="mb-3 text-traveloop-muted" size={28} />}
              <span className="text-sm font-semibold text-traveloop-midnight">Choose a cover photo preview</span>
              <input className="hidden" type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }} />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Start date" type="date" value={form.start_date} onChange={update("start_date")} />
            <Input label="End date" type="date" value={form.end_date} onChange={update("end_date")} />
            <Input label="Total budget" min="0" placeholder="2400" type="number" value={form.total_budget} onChange={update("total_budget")} />
            <label className="flex items-center justify-between rounded-lg border border-traveloop-border bg-white px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-traveloop-midnight">Make public</span>
                <span className="text-xs text-traveloop-muted">Generate a share link for the itinerary.</span>
              </span>
              <input checked={form.is_public} onChange={update("is_public")} type="checkbox" />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-lg border border-traveloop-border bg-traveloop-mist/40 p-5">
            <h2 className="text-xl font-semibold text-traveloop-midnight">{form.name}</h2>
            <p className="mt-2 text-sm leading-6 text-traveloop-muted">{form.description || "No description yet."}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div><dt className="text-xs uppercase text-traveloop-muted">Start</dt><dd className="font-semibold">{form.start_date}</dd></div>
              <div><dt className="text-xs uppercase text-traveloop-muted">End</dt><dd className="font-semibold">{form.end_date}</dd></div>
              <div><dt className="text-xs uppercase text-traveloop-muted">Public</dt><dd className="font-semibold">{form.is_public ? "Yes" : "No"}</dd></div>
            </dl>
          </div>
        ) : null}

        <div className="mt-8 flex justify-between">
          <Button disabled={step === 0} icon={<ArrowLeft size={16} />} onClick={() => setStep((value) => value - 1)} variant="secondary">
            Back
          </Button>
          {step < 2 ? (
            <Button disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button icon={<Check size={16} />} loading={loading} onClick={handleSubmit}>
              Create trip
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
