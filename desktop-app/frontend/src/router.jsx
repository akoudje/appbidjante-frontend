// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/auth/RequireAuth";
import RequireRole from "./components/auth/RequireRole";

import Dashboard from "./pages/Dashboard";
import Membres from "./pages/Membres";
import Deces from "./pages/Deces";
import Archives from "./pages/Archives";
import Cotisations from "./pages/Cotisations";
import Familles from "./pages/Familles";
import CotisationsLignees from "./pages/CotisationsLignees";
import Categories from "./pages/Categories";
import Lignees from "./pages/Lignees";
import Paiements from "./pages/Paiements";
import Transactions from "./pages/Transactions";
import Soldes from "./pages/Soldes";
import BilanAnnuel from "./pages/BilanAnnuel";
import Enterrements from "./pages/Enterrements";
import Funerailles from "./pages/Funerailles";
import Contributions from "./pages/Contributions";
import VillageMembers from "./pages/VillageMembers";
import Settings from "./pages/Settings";
import UsersManagementPage from "./pages/UsersManagementPage";
import MenuBuilder from "./pages/admin/MenuBuilder";
import Configurations from "./pages/admin/Configurations";
import Communiques from "./pages/Communiques";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import Amendes from "./pages/Amendes";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  // ✅ Pages publiques (sans MainLayout)
  { path: "/login", element: <LoginPage /> },

  // ✅ Partie protégée (RequireAuth + MainLayout)
  {
    path: "/",
    element: <RequireAuth />, // Vérifie si l'utilisateur est connecté
    children: [
      {
        element: <MainLayout />, // Layout général (sidebar, header, etc.)
        children: [
          { index: true, element: <Dashboard /> },
          { path: "membres", element: <Membres /> },
          { path: "deces", element: <Deces /> },
          { path: "archives", element: <Archives /> },
          { path: "cotisations", element: <Cotisations /> },
          { path: "cotisationslignees", element: <CotisationsLignees /> },
          { path: "familles", element: <Familles /> },
          { path: "categories", element: <Categories /> },
          { path: "lignees", element: <Lignees /> },
          { path: "paiements", element: <Paiements /> },
          { path: "transactions", element: <Transactions /> },
          { path: "soldes", element: <Soldes /> },
          { path: "bilan-annuel", element: <BilanAnnuel /> },
          { path: "enterrements", element: <Enterrements /> },
          { path: "funerailles", element: <Funerailles /> },
          { path: "contributions", element: <Contributions /> },
          { path: "villagemembers", element: <VillageMembers /> },
          { path: "profile", element: <ProfilePage /> },

          { path: "usersmanagements", element: ( <RequireRole allowedRoles={["superadmin"]}> <UsersManagementPage /> </RequireRole>  ), },
          { path: "settings", element: ( <RequireRole allowedRoles={["superadmin"]}>  <Settings />  </RequireRole>  ), },
          { path: "admin/menu", element: ( <RequireRole allowedRoles={["superadmin"]}> <MenuBuilder /> </RequireRole> ), },
          { path: "admin/configurations", element: ( <RequireRole allowedRoles={["superadmin"]}>  <Configurations /> </RequireRole>  ), },
          { path: "register",  element: ( <RequireRole allowedRoles={["superadmin"]}>  <RegisterPage />  </RequireRole>  ), },
          { path: "communiques", element: ( <RequireRole allowedRoles={["superadmin"]}> <Communiques /> </RequireRole> ), },
          { path: "amendes", element: ( <RequireRole allowedRoles={["superadmin"]}> <Amendes /> </RequireRole> ), },

          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default router;
