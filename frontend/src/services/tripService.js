import {
  activitiesAPI,
  adminAPI,
  citiesAPI,
  communityAPI,
  tripsAPI,
} from "./api";

export const tripService = {
  listTrips: tripsAPI.getAll,
  createTrip: tripsAPI.create,
  getTrip: tripsAPI.getOne,
  updateTrip: tripsAPI.update,
  deleteTrip: tripsAPI.remove,
  getCities: (query = "") => citiesAPI.search({ q: query }),
  getActivities: (query = "", city = "") => activitiesAPI.search({ q: query, city }),
  getCommunityPosts: communityAPI.getAll,
  getAdminStats: adminAPI.getStats,
};
