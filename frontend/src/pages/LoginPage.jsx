import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email";
    if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await login(form);
      showToast("success", "Welcome back to Traveloop");
      navigate(location.state?.from || "/dashboard");
    } catch (loginError) {
      showToast("error", loginError.response?.data?.error || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
      <div className="hidden overflow-hidden rounded-lg shadow-card lg:block">
        <img
          alt="Open travel journal beside a window"
          className="h-[540px] w-full object-cover"
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80"
        />
      </div>
      <form className="traveloop-card mx-auto w-full max-w-md p-8" onSubmit={handleSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-clay">Welcome back</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-traveloop-midnight">Sign in to Traveloop</h1>
        <p className="mt-2 text-sm text-traveloop-midnight/70">Use demo credentials: user1@traveloop.com / demo1234.</p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="traveloop-label">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-traveloop-muted" size={18} />
              <input className="traveloop-input pl-10" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            {errors.email ? <span className="mt-1 block text-xs text-traveloop-danger">{errors.email}</span> : null}
          </label>
          <label className="block">
            <span className="traveloop-label">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-traveloop-muted" size={18} />
              <input className="traveloop-input pl-10 pr-10" type={showPassword ? "text" : "password"} placeholder="demo1234" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button className="absolute right-3 top-3 text-traveloop-muted" type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? <span className="mt-1 block text-xs text-traveloop-danger">{errors.password}</span> : null}
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-traveloop-muted">
          <label className="inline-flex items-center gap-2">
            <input className="rounded border-traveloop-border text-traveloop-sand" type="checkbox" />
            Remember me
          </label>
          <button className="font-medium text-traveloop-sand-dark" type="button" onClick={() => showToast("info", "Password reset flow is ready for SMTP wiring")}>
            Forgot password?
          </button>
        </div>

        <Button className="mt-6 w-full" loading={loading} type="submit">
          Sign in
        </Button>

        <p className="mt-4 text-sm text-traveloop-midnight/70">
          New here? <Link to="/register" className="font-medium text-traveloop-clay">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
