import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import ActivitySearchPage from "./pages/ActivitySearchPage";
import AdminPage from "./pages/AdminPage";
import BudgetPage from "./pages/BudgetPage";
import CitySearchPage from "./pages/CitySearchPage";
import CommunityPage from "./pages/CommunityPage";
import CreateTripPage from "./pages/CreateTripPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";
import ItineraryViewPage from "./pages/ItineraryViewPage";
import LoginPage from "./pages/LoginPage";
import NotesPage from "./pages/NotesPage";
import NotFoundPage from "./pages/NotFoundPage";
import PackingPage from "./pages/PackingPage";
import ProfilePage from "./pages/ProfilePage";
import PublicTripPage from "./pages/PublicTripPage";
import RegisterPage from "./pages/RegisterPage";
import TripDetailPage from "./pages/TripDetailPage";
import TripsPage from "./pages/TripsPage";

function RequireAuth({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-traveloop-midnight">Loading Traveloop...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RootRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <HomePage />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/share/:slug" element={<PublicTripPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<RootRoute />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/public/trip/:slug" element={<PublicTripPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips"
          element={
            <RequireAuth>
              <TripsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/new"
          element={
            <RequireAuth>
              <CreateTripPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <RequireAuth>
              <TripDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/itinerary"
          element={
            <RequireAuth>
              <ItineraryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/itinerary/view"
          element={
            <RequireAuth>
              <ItineraryViewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/budget"
          element={
            <RequireAuth>
              <BudgetPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/packing"
          element={
            <RequireAuth>
              <PackingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trips/:id/notes"
          element={
            <RequireAuth>
              <NotesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search/cities"
          element={
            <RequireAuth>
              <CitySearchPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search/activities"
          element={
            <RequireAuth>
              <ActivitySearchPage />
            </RequireAuth>
          }
        />
        <Route
          path="/community"
          element={
            <RequireAuth>
              <CommunityPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
