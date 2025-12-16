// src/components/SidebarDynamic.jsx
import { useEffect, useState, useCallback, memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getIconComponent } from "../utils/iconsLoader";

// Composant Squelette - taille augmentée
const SidebarSkeleton = memo(({ collapsed }) => (
  <div className="p-4 space-y-6">
    {[1, 2, 3].map(groupIndex => (
      <div key={groupIndex} className="space-y-3">
        {!collapsed && (
          <div className="px-3">
            <div className="h-4 skeleton rounded w-28"></div> {/* PLUS GRAND */}
          </div>
        )}
        <div className="space-y-2">
          {[1, 2, 3].map(itemIndex => (
            <div 
              key={itemIndex} 
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
            >
              <div className="w-10 h-10 skeleton rounded-xl"></div> {/* PLUS GRAND */}
              {!collapsed && (
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 skeleton rounded w-36"></div> {/* PLUS GRAND */}
                  <div className="h-3 skeleton rounded w-28"></div> {/* PLUS GRAND */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));

SidebarSkeleton.displayName = 'SidebarSkeleton';

// Composant MenuItem - SEULEMENT la taille augmentée
const MenuItem = memo(({ item, collapsed }) => {
  const Icon = getIconComponent(item.icon);
  
  const getLabelParts = (label) => {
    const separators = ["—", "-", "|", "–"];
    for (const sep of separators) {
      if (label.includes(sep)) {
        const parts = label.split(sep).map(s => s.trim());
        return {
          title: parts[0] || label,
          subtitle: parts[1] || ""
        };
      }
    }
    return { title: label, subtitle: "" };
  };

  const { title, subtitle } = getLabelParts(item.label);

  return (
    <NavLink
      to={item.path || "/"}
      className={({ isActive }) =>
        `group flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-3 
        rounded-xl transition-all duration-200 
        ${isActive
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'text-foreground hover:bg-accent hover:text-foreground'
        }`
      }
      title={item.label}
    >
      {({ isActive }) => (
        <>
          {/* Icône PLUS GRANDE */}
          <div className={`relative flex-shrink-0 flex items-center justify-center 
            ${collapsed ? 'w-14 h-14' : 'w-11 h-11'}`}>
            {Icon ? (
              <Icon 
                className={`${collapsed ? 'w-8 h-8' : 'w-7 h-7'} /* TAILLE AUGMENTÉE */
                  ${isActive 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground group-hover:text-foreground'
                  }`}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-muted"></div>
            )}
            
            {/* Indicateur d'activité */}
            {collapsed && isActive && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-8 
                bg-primary rounded-full"></div>
            )}
          </div>

          {/* Texte PLUS GRAND */}
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* TITRE PLUS GRAND */}
              <div className={`font-medium truncate transition-transform duration-200 
                text-base /* TAILLE AUGMENTÉE */
                ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                {title}
              </div>
              
              {/* Sous-titre PLUS GRAND */}
              {subtitle && (
                <div className={`truncate transition-all duration-300 
                  text-sm /* TAILLE AUGMENTÉE */
                  ${isActive 
                    ? 'text-primary-foreground/90 font-medium opacity-100' 
                    : 'text-muted-foreground opacity-100 group-hover:text-foreground'
                  }`}>
                  {subtitle}
                </div>
              )}
              
              {/* Espacement */}
              {!subtitle && <div className="h-4"></div>}
            </div>
          )}
          
          {/* Tooltip pour mode réduit */}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 
              bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl 
              opacity-0 invisible group-hover:opacity-100 group-hover:visible 
              transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              <div className="font-medium text-sm">{title}</div> {/* PLUS GRAND */}
              {subtitle && (
                <div className="text-xs text-gray-300 mt-0.5">{subtitle}</div>
              )}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 
                border-transparent border-r-gray-900 dark:border-r-gray-700" />
            </div>
          )}
        </>
      )}
    </NavLink>
  );
});

MenuItem.displayName = 'MenuItem';

// Composant Group - SEULEMENT la taille augmentée
const MenuGroup = memo(({ group, collapsed }) => {
  if (group.items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Group label PLUS GRAND */}
      {!collapsed && (
        <div className="px-3 pt-1">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground 
            tracking-wider mb-2">
            {group.name}
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        </div>
      )}
      
      {/* Items */}
      <div className={`${collapsed ? 'space-y-2' : 'space-y-1.5'}`}>
        {group.items.map((item) => (
          <div key={item.id} className="relative">
            <MenuItem 
              item={item} 
              collapsed={collapsed}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

MenuGroup.displayName = 'MenuGroup';

export default function SidebarDynamic({ userRole, collapsed = false }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/menu", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        cache: "default"
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!Array.isArray(data)) {
        setMenu([]);
        return;
      }

      const filtered = data
        .map((group) => ({
          ...group,
          items: group.items
            .filter(
              (item) =>
                item.minRole === "user" ||
                item.minRole === userRole ||
                userRole === "superadmin"
            )
            .map(item => ({
              ...item,
              path: item.path?.startsWith('/') ? item.path : `/${item.path}`
            }))
        }))
        .filter(group => group.items.length > 0);

      setMenu(filtered);
    } catch (err) {
      console.error("❌ Erreur SidebarDynamic :", err);
      setError("Impossible de charger le menu");
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  if (loading) {
    return <SidebarSkeleton collapsed={collapsed} />;
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
          dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadMenu}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="rounded-xl bg-muted p-6">
          <p className="text-muted-foreground text-base"> {/* PLUS GRAND */}
            Aucun menu disponible pour votre rôle
          </p>
          <p className="text-sm text-muted-foreground mt-1"> {/* PLUS GRAND */}
            Contactez un administrateur
          </p>
        </div>
      </div>
    );
  }

  return (
    <nav className="py-4" aria-label="Navigation principale">
      <div className="space-y-6">
        {menu.map((group) => (
          <MenuGroup 
            key={group.id} 
            group={group} 
            collapsed={collapsed}
          />
        ))}
      </div>
      
      {collapsed && (
        <div className="mt-8 px-3">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent">
              <span className="text-xs text-muted-foreground"> {/* PLUS GRAND */}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1"></span>
                Mode réduit
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}