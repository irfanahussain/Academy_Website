import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  getToken,
  loginAccount,
  logoutAccount,
  registerAccount,
  setToken,
  updateProfile,
  changePassword,
} from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready

  useEffect(() => {
    if (!getToken()) {
      setStatus("ready");
      return;
    }
    fetchCurrentUser()
      .then((data) => setUser(data))
      .catch(() => setToken(null))
      .finally(() => setStatus("ready"));
  }, []);

  async function login(email, password) {
    const data = await loginAccount({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(fullName, email, password) {
    const data = await registerAccount({ full_name: fullName, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await logoutAccount();
    } catch {
      // Token may already be invalid; clear local state regardless.
    }
    setToken(null);
    setUser(null);
  }

  async function updateAvatar(file) {
    const updatedUser = await updateProfile({ avatar: file });
    setUser(updatedUser);
    return updatedUser;
  }

  async function updateProfileDetails({ fullName, email, phone }) {
    const updatedUser = await updateProfile({ fullName, email, phone });
    setUser(updatedUser);
    return updatedUser;
  }

  async function changeAccountPassword({ oldPassword, newPassword }) {
    return changePassword({ oldPassword, newPassword });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        logout,
        updateAvatar,
        updateProfileDetails,
        changeAccountPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}