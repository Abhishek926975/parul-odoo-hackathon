import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("traveloop_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("traveloop_token");
      if (!["/login", "/register"].includes(window.location.pathname)) {
        window.dispatchEvent(new Event("traveloop:unauthorized"));
      }
    }

    return Promise.reject(error);
  },
);

const unwrap = async (promise) => {
  const { data } = await promise;
  return data;
};

export const authAPI = {
  login: (payload) => unwrap(api.post("/auth/login", payload)),
  register: (payload) => unwrap(api.post("/auth/register", payload)),
  logout: () => unwrap(api.post("/auth/logout")),
  getMe: () => unwrap(api.get("/auth/me")),
  updateProfile: (payload) => unwrap(api.put("/auth/profile", payload)),
  uploadPhoto: (formData) =>
    unwrap(api.post("/auth/upload-photo", formData, { headers: { "Content-Type": "multipart/form-data" } })),
};

export const tripsAPI = {
  getAll: (params = {}) => unwrap(api.get("/trips", { params })),
  getOne: (id) => unwrap(api.get(`/trips/${id}`)),
  create: (payload) => unwrap(api.post("/trips", payload)),
  update: (id, payload) => unwrap(api.put(`/trips/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/trips/${id}`)),
  getPublic: (slug) => unwrap(api.get(`/trips/public/${slug}`)),
};

export const stopsAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/stops`)),
  create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/stops`, payload)),
  update: (tripId, stopId, payload) => unwrap(api.put(`/trips/${tripId}/stops/${stopId}`, payload)),
  remove: (tripId, stopId) => unwrap(api.delete(`/trips/${tripId}/stops/${stopId}`)),
};

export const sectionsAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/sections`)),
  create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/sections`, payload)),
  update: (tripId, sectionId, payload) => unwrap(api.put(`/trips/${tripId}/sections/${sectionId}`, payload)),
  remove: (tripId, sectionId) => unwrap(api.delete(`/trips/${tripId}/sections/${sectionId}`)),
};

export const activitiesAPI = {
  search: (params = {}) => unwrap(api.get("/activities", { params })),
  getFeatured: () => unwrap(api.get("/activities/featured")),
  getOne: (id) => unwrap(api.get(`/activities/${id}`)),
};

export const tripActivitiesAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/activities`)),
  add: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/activities`, payload)),
  update: (tripId, id, payload) => unwrap(api.put(`/trips/${tripId}/activities/${id}`, payload)),
  remove: (tripId, id) => unwrap(api.delete(`/trips/${tripId}/activities/${id}`)),
};

export const packingAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/packing`)),
  create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/packing`, payload)),
  toggle: (tripId, itemId, payload) => unwrap(api.patch(`/trips/${tripId}/packing/${itemId}`, payload)),
  remove: (tripId, itemId) => unwrap(api.delete(`/trips/${tripId}/packing/${itemId}`)),
  reset: (tripId) => unwrap(api.post(`/trips/${tripId}/packing/reset`)),
};

export const notesAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/notes`)),
  create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/notes`, payload)),
  update: (tripId, noteId, payload) => unwrap(api.put(`/trips/${tripId}/notes/${noteId}`, payload)),
  remove: (tripId, noteId) => unwrap(api.delete(`/trips/${tripId}/notes/${noteId}`)),
};

export const expensesAPI = {
  getAll: (tripId) => unwrap(api.get(`/trips/${tripId}/expenses`)),
  create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/expenses`, payload)),
  update: (tripId, expId, payload) => unwrap(api.put(`/trips/${tripId}/expenses/${expId}`, payload)),
  remove: (tripId, expId) => unwrap(api.delete(`/trips/${tripId}/expenses/${expId}`)),
};

export const citiesAPI = {
  search: (params = {}) => unwrap(api.get("/cities", { params })),
  getFeatured: () => unwrap(api.get("/cities/featured")),
};

export const communityAPI = {
  getAll: (params = {}) => unwrap(api.get("/community", { params })),
  getOne: (postId) => unwrap(api.get(`/community/${postId}`)),
  create: (payload) => unwrap(api.post("/community", payload)),
  like: (postId) => unwrap(api.patch(`/community/${postId}/like`)),
};

export const adminAPI = {
  getStats: () => unwrap(api.get("/admin/stats")),
  getUsers: (params = {}) => unwrap(api.get("/admin/users", { params })),
  getTrips: (params = {}) => unwrap(api.get("/admin/trips", { params })),
  deleteUser: (userId) => unwrap(api.delete(`/admin/users/${userId}`)),
  deleteTrip: (tripId) => unwrap(api.delete(`/admin/trips/${tripId}`)),
};

export default api;
