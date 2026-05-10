import { createContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("traveloop_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener("traveloop:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("traveloop:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    authAPI
      .getMe()
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem("traveloop_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const saveSession = (response) => {
    const nextToken = response.data.token;
    localStorage.setItem("traveloop_token", nextToken);
    setToken(nextToken);
    setUser(response.data.user);
    window.dispatchEvent(new Event("traveloop:session"));
    return response;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      loading: isLoading,
      isAuthenticated: Boolean(user && token),
      async login(payload) {
        return saveSession(await authAPI.login(payload));
      },
      async register(payload) {
        return saveSession(await authAPI.register(payload));
      },
      async updateUser(payload) {
        const response = await authAPI.updateProfile(payload);
        setUser(response.data.user);
        return response;
      },
      async logout() {
        await authAPI.logout().catch(() => null);
        localStorage.removeItem("traveloop_token");
        setToken(null);
        setUser(null);
        window.dispatchEvent(new Event("traveloop:session"));
      },
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
