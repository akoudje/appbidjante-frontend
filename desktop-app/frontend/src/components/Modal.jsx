import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
  confirmOnClose = false,
}) {
  const panelRef = useRef(null);

  /*
   * ⚠️ Spécial : les hooks doivent TOUJOURS être appelés,
   *    même quand open = false.
   */

  // Désactive le scroll du body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "auto");
    }
  }, [open]);

  // ESC → fermeture
  useEffect(() => {
    if (!open) return;

    const fn = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  // Focus auto
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleClose = () => {
    if (confirmOnClose) {
      const ask = confirm(
        "Êtes-vous sûr de vouloir fermer ?\nLes informations non enregistrées seront perdues."
      );
      if (!ask) return;
    }
    onClose?.();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  // 👉 Maintenant on peut conditionner le rendu SANS risque
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          w-full ${sizes[size]}
          bg-white dark:bg-gray-900 rounded-xl shadow-xl relative
          animate-modalIn
          max-h-[90vh] flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">{children}</div>

        <style>
          {`
            @keyframes modalIn {
              from {
                opacity: 0;
                transform: scale(0.97) translateY(8px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-modalIn {
              animation: modalIn 0.22s ease-out forwards;
            }
          `}
        </style>
      </div>
    </div>
  );
}
