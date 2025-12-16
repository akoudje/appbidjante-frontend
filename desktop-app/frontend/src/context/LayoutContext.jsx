import { createContext, useContext, useState } from "react";

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);
