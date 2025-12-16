// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./theme/useTheme.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { Toaster } from "react-hot-toast";
import router from "./router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              className: "bg-card text-card-foreground border border-border",
              duration: 4000,
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "white",
                },
              },
            }}
          />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);




