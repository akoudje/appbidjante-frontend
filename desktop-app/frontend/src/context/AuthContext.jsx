// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((user) => setCurrentUser(user))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ currentUser, loadingUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
