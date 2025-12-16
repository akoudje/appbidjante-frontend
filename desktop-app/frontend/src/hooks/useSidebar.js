// src/hooks/useSidebar.js
import { useState, useEffect, useCallback } from "react";

export default function useSidebar() {
  // Récupérer l'état depuis localStorage ou utiliser la valeur par défaut (false = réduit)
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-state');
    return saved ? JSON.parse(saved) : false; // false par défaut pour ouvrir réduit
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggle = useCallback(() => {
    setOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-state', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    localStorage.setItem('sidebar-state', JSON.stringify(false));
  }, []);

  const openSidebar = useCallback(() => {
    setOpen(true);
    localStorage.setItem('sidebar-state', JSON.stringify(true));
  }, []);

  // Détecte si on est sur mobile
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Sur mobile, toujours fermé par défaut
      if (mobile && open) {
        setOpen(false);
        localStorage.setItem('sidebar-state', JSON.stringify(false));
      }
      // Sur desktop, restaurer l'état sauvegardé
      if (!mobile && !open && localStorage.getItem('sidebar-state') === null) {
        setOpen(true); // Sur desktop, on peut ouvrir si pas de préférence
        localStorage.setItem('sidebar-state', JSON.stringify(true));
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  // Gestion du hover pour desktop (sidebar réduite)
  useEffect(() => {
    if (!isMobile && !open) {
      const sidebar = document.querySelector('.sidebar-panel');
      if (!sidebar) return;

      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);

      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      };
    } else {
      setIsHovered(false);
    }
  }, [isMobile, open]);

  // Fermer la sidebar si clic extérieur (mobile uniquement)
  useEffect(() => {
    if (!isMobile || !open) return;

    const handler = (e) => {
      const sidebar = document.querySelector('.sidebar-panel');
      const toggleBtn = document.querySelector('[aria-label*="menu"]');
      
      if (
        sidebar && 
        !sidebar.contains(e.target) && 
        toggleBtn && 
        !toggleBtn.contains(e.target)
      ) {
        close();
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open, isMobile, close]);

  // Fermer avec la touche ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) {
        close();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  // Synchroniser avec d'autres tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sidebar-state') {
        setOpen(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Retourner toutes les fonctions et états nécessaires
  return { 
    open, 
    toggle, 
    close,          // <-- Important pour MainLayout
    openSidebar,
    isMobile, 
    isHovered,
    // Largeur effective (pour les transitions)
    effectiveWidth: open ? 288 : (isHovered ? 288 : 80),
    // Fonction pour définir l'état directement (si besoin)
    setOpen: (value) => {
      setOpen(value);
      localStorage.setItem('sidebar-state', JSON.stringify(value));
    }
  };
}