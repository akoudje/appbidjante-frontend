// src/components/Modal.jsx

import { useEffect, useRef, useState } from "react";
import { 
  XMarkIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  size = "md",
  type = "default", // default, success, warning, danger, info
  confirmOnClose = false,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showBackButton = false,
  onBack,
  footer,
  loading = false,
  hideHeader = false,
  fullScreenOnMobile = false,
  className = "",
  contentClassName = "",
}) {
  const panelRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Configuration des types
  const typeConfig = {
    default: {
      icon: null,
      headerBg: "bg-white dark:bg-gray-900",
      borderColor: "border-gray-200 dark:border-gray-700",
      iconColor: "text-gray-600 dark:text-gray-300",
    },
    success: {
      icon: CheckCircleIcon,
      headerBg: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-700",
      iconColor: "text-green-600 dark:text-green-400",
      accentColor: "text-green-600",
    },
    warning: {
      icon: ExclamationTriangleIcon,
      headerBg: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-700",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      accentColor: "text-yellow-600",
    },
    danger: {
      icon: ExclamationTriangleIcon,
      headerBg: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-700",
      iconColor: "text-red-600 dark:text-red-400",
      accentColor: "text-red-600",
    },
    info: {
      icon: InformationCircleIcon,
      headerBg: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-700",
      iconColor: "text-blue-600 dark:text-blue-400",
      accentColor: "text-blue-600",
    },
  };

  const config = typeConfig[type] || typeConfig.default;
  const IconComponent = config.icon;

  // Désactive le scroll du body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px"; // Compensation pour la scrollbar
      return () => {
        document.body.style.overflow = "auto";
        document.body.style.paddingRight = "0";
      };
    }
  }, [open]);

  // ESC → fermeture
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, closeOnEsc, loading]);

  // Focus auto et gestion du scroll
  useEffect(() => {
    if (open) {
      // Delay pour l'animation
      setTimeout(() => {
        panelRef.current?.focus();
      }, 100);
      
      // Empêche le scroll du parent
      const preventScroll = (e) => {
        if (e.target === panelRef.current) {
          e.stopPropagation();
        }
      };
      
      window.addEventListener('wheel', preventScroll, { passive: false });
      return () => window.removeEventListener('wheel', preventScroll);
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    
    if (confirmOnClose) {
      const ask = confirm(
        "Êtes-vous sûr de vouloir fermer ?\nLes informations non enregistrées seront perdues."
      );
      if (!ask) return;
    }
    
    // Animation de fermeture
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 200);
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  const sizes = {
    xs: "max-w-xs",
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    "2xl": "max-w-6xl",
    full: "max-w-full mx-4",
  };

  // Animation de fermeture
  if (!open && !isClosing) return null;

  return (
    <>
      {/* Backdrop avec animation */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isClosing 
            ? "bg-black/0 backdrop-blur-0" 
            : "bg-black/50 backdrop-blur-sm"
        } ${fullScreenOnMobile ? "md:items-center" : "items-center"}`}
        onClick={handleBackdropClick}
      >
        {/* Modal principal */}
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`
            w-full ${sizes[size]}
            bg-white dark:bg-gray-900 rounded-2xl shadow-2xl relative
            transition-all duration-200 transform
            ${isClosing 
              ? "opacity-0 scale-95 translate-y-4" 
              : "opacity-100 scale-100 translate-y-0"
            }
            ${fullScreenOnMobile ? "md:max-h-[90vh]" : "max-h-[90vh]"}
            ${fullScreenOnMobile ? "h-screen md:h-auto" : ""}
            ${fullScreenOnMobile ? "rounded-none md:rounded-2xl" : ""}
            ${className}
            flex flex-col
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {!hideHeader && (
            <div className={`
              p-6 border-b dark:border-gray-800 flex items-center justify-between
              ${config.headerBg} ${config.borderColor}
              ${fullScreenOnMobile ? "md:rounded-t-2xl" : "rounded-t-2xl"}
            `}>
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <button
                    onClick={onBack}
                    disabled={loading}
                    className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                )}
                
                {IconComponent && (
                  <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                )}
                
                <div>
                  {title && (
                    <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                      {title}
                      {loading && (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className={`
                    p-2 rounded-lg transition-all duration-150
                    hover:bg-black/10 dark:hover:bg-white/10
                    active:scale-95
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  aria-label="Fermer"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`
            flex-1 overflow-y-auto p-6 ${contentClassName}
            ${!hideHeader ? "" : "pt-8"}
            ${footer ? "pb-4" : ""}
          `}>
            {children}
          </div>

          {/* Footer optionnel */}
          {footer && (
            <div className={`
              p-6 border-t dark:border-gray-800
              bg-gray-50 dark:bg-gray-900/50
              ${fullScreenOnMobile ? "md:rounded-b-2xl" : "rounded-b-2xl"}
            `}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Composant ModalSection pour structurer le contenu
function ModalSection({ children, title, className = "" }) {
  return (
    <div className={`mb-6 last:mb-0 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

// Composant ModalActions pour les boutons d'action
function ModalActions({ children, className = "", align = "right" }) {
  const alignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };
  
  return (
    <div className={`flex gap-3 ${alignment[align]} ${className}`}>
      {children}
    </div>
  );
}

// Hook pour utiliser le modal facilement
function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// ⚠️ TRÈS IMPORTANT : Exports
export default Modal;
export { ModalSection, ModalActions, useModal };