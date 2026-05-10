import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { activitiesAPI, citiesAPI, communityAPI, tripsAPI } from "../services/api";

export const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrips = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await tripsAPI.getAll(params);
      setTrips(response.data.trips || []);
      return response;
    } catch (error) {
      setTrips([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleSession = () => {
      if (localStorage.getItem("traveloop_token")) {
        fetchTrips().catch(() => null);
      } else {
        setTrips([]);
        setCurrentTrip(null);
      }
    };

    window.addEventListener("traveloop:session", handleSession);
    citiesAPI
      .getFeatured()
      .then((response) => setCities(response.data.cities || []))
      .catch(() => setCities([]));
    activitiesAPI
      .getFeatured()
      .then((response) => setActivities(response.data.activities || []))
      .catch(() => setActivities([]));
    communityAPI
      .getAll()
      .then((response) => setCommunityPosts(response.data.posts || []))
      .catch(() => setCommunityPosts([]));

    if (localStorage.getItem("traveloop_token")) {
      fetchTrips().catch(() => null);
    }

    return () => window.removeEventListener("traveloop:session", handleSession);
  }, [fetchTrips]);

  const value = useMemo(
    () => ({
      trips,
      currentTrip,
      cities,
      activities,
      communityPosts,
      isLoading,
      fetchTrips,
      refreshTrips: fetchTrips,
      async fetchTrip(id) {
        setIsLoading(true);
        try {
          const response = await tripsAPI.getOne(id);
          setCurrentTrip(response.data.trip);
          return response;
        } finally {
          setIsLoading(false);
        }
      },
      async createTrip(payload) {
        const response = await tripsAPI.create(payload);
        setTrips((existing) => [response.data.trip, ...existing]);
        return response;
      },
      async updateTrip(id, payload) {
        const response = await tripsAPI.update(id, payload);
        setTrips((existing) => existing.map((trip) => (trip.id === id ? response.data.trip : trip)));
        setCurrentTrip((existing) => (existing?.id === id ? { ...existing, ...response.data.trip } : existing));
        return response;
      },
      async deleteTrip(id) {
        const response = await tripsAPI.remove(id);
        setTrips((existing) => existing.filter((trip) => trip.id !== id));
        if (currentTrip?.id === id) setCurrentTrip(null);
        return response;
      },
      async refreshCommunity() {
        const response = await communityAPI.getAll();
        setCommunityPosts(response.data.posts || []);
        return response;
      },
      async refreshCities(params = {}) {
        const response = await citiesAPI.search(params);
        setCities(response.data.cities || []);
        return response;
      },
      async refreshActivities(params = {}) {
        const response = await activitiesAPI.search(params);
        setActivities(response.data.activities || []);
        return response;
      },
      setTripsFromResponse(response) {
        setTrips(response.data.trips || []);
      },
    }),
    [trips, currentTrip, cities, activities, communityPosts, isLoading, fetchTrips],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
