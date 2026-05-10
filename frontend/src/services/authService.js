import { authAPI } from "./api";

export const authService = {
  register: authAPI.register,
  login: authAPI.login,
  logout: authAPI.logout,
  me: authAPI.getMe,
  updateProfile: authAPI.updateProfile,
  uploadPhoto: authAPI.uploadPhoto,
};
