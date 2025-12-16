// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage"; // à adapter
import Dashboard from "./pages/Dashboard"; // exemple
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme/useTheme"; // <-- ajout

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider> {/* <-- enveloppe ton app */}
        <Toaster position="top-right" richColors />

        <BrowserRouter>
          <Routes>
            {/* Page Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Pages protégées */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              {/* Ajoute ici toutes tes pages */}
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

