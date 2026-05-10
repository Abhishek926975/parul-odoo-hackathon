import {
  MapPin,
  Menu,
  Compass,
  Users,
  Shield,
  Sparkles,
  Search,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "./ui/Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Compass },
  { to: "/trips", label: "Trips", icon: MapPin },
  { to: "/search/cities", label: "Search", icon: Search },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin", icon: Shield },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authRoute = ["/login", "/register"].includes(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen pb-20 text-traveloop-midnight lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-traveloop-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={user ? "/dashboard" : "/login"}
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-traveloop-midnight text-white shadow-card">
              <Sparkles size={20} />
            </span>
            <span>
              <span className="block font-display text-xl leading-none">Traveloop</span>
              <span className="hidden text-xs uppercase tracking-[0.25em] text-traveloop-clay sm:block">
                Where every journey loops back to you
              </span>
            </span>
          </Link>

          <Button
            aria-label="Toggle menu"
            icon={open ? <X size={18} /> : <Menu size={18} />}
            onClick={() => setOpen((value) => !value)}
            variant="secondary"
            className="lg:hidden"
          />

          {!authRoute ? (
            <nav className="hidden items-center gap-2 lg:flex">
              {navItems
                .filter((item) => item.to !== "/admin" || user?.role === "admin")
                .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-traveloop-midnight text-white"
                      : "text-traveloop-midnight/70 hover:bg-traveloop-mist"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
                ))}
            {user ? (
              <Button className="ml-2" onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            ) : (
              <Link className="traveloop-button-primary ml-2" to="/login">
                Sign in
              </Link>
            )}
          </nav>
          ) : null}
        </div>

        {open && !authRoute ? (
          <div className="border-t border-traveloop-border bg-white px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems
                .filter((item) => item.to !== "/admin" || user?.role === "admin")
                .map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-traveloop-mist"
                >
                  {label}
                </NavLink>
                ))}
              {user ? (
                <Button className="mt-2 justify-center" onClick={handleLogout} variant="secondary">
                  Logout
                </Button>
              ) : (
                <Link
                  className="traveloop-button-primary mt-2 justify-center"
                  to="/login"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      {!authRoute && user ? (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-traveloop-border bg-white lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">
            {navItems
              .filter((item) => ["/dashboard", "/trips", "/search/cities", "/community", "/profile"].includes(item.to))
              .map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                      isActive ? "text-traveloop-sand-dark" : "text-traveloop-muted"
                    }`
                  }
                >
                  <Icon size={19} />
                  {label}
                </NavLink>
              ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
