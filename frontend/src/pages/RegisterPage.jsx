import { Camera } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    city: "",
    country: "",
    additionalInfo: "",
    password: "",
    confirmPassword: "",
  });
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      showToast("success", "Traveloop account created");
      navigate("/dashboard");
    } catch (registerError) {
      setError(registerError.response?.data?.error || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <div className="hidden overflow-hidden rounded-lg shadow-card lg:block">
        <img
          alt="Train route through mountains"
          className="h-[620px] w-full object-cover"
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
        />
      </div>
      <form className="traveloop-card mx-auto w-full max-w-2xl p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-clay">Join Traveloop</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-traveloop-midnight">Create your account</h1>
        <label className="mt-6 flex w-fit cursor-pointer items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-traveloop-mist text-traveloop-midnight">
            {avatar ? <img alt="Avatar preview" className="h-full w-full object-cover" src={avatar} /> : <Camera size={22} />}
          </span>
          <span className="text-sm font-semibold text-traveloop-sand-dark">Upload avatar</span>
          <input
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setAvatar(URL.createObjectURL(file));
            }}
          />
        </label>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <input className="traveloop-input" required placeholder="First name" value={form.firstName} onChange={update("firstName")} />
          <input className="traveloop-input" required placeholder="Last name" value={form.lastName} onChange={update("lastName")} />
          <input className="traveloop-input" required type="email" placeholder="Email" value={form.email} onChange={update("email")} />
          <input className="traveloop-input" placeholder="Phone number" value={form.phoneNumber} onChange={update("phoneNumber")} />
          <input className="traveloop-input" required placeholder="City" value={form.city} onChange={update("city")} />
          <input className="traveloop-input" required placeholder="Country" value={form.country} onChange={update("country")} />
          <textarea className="traveloop-input sm:col-span-2" rows="3" placeholder="Additional information" value={form.additionalInfo} onChange={update("additionalInfo")} />
          <input className="traveloop-input" required type="password" placeholder="Password" value={form.password} onChange={update("password")} />
          <input className="traveloop-input" required type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={update("confirmPassword")} />
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <Button className="mt-6 w-full" loading={loading} type="submit">
          Create account
        </Button>

        <p className="mt-4 text-sm text-traveloop-midnight/70">
          Already have an account? <Link to="/login" className="font-medium text-traveloop-clay">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
