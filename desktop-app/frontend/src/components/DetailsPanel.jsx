// Alternative encore plus light
import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function DetailsPanelLight({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  stayOpenOnChange = false,
  width,
}) {
  const [closing, setClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (open) setShouldAnimate(true);
  }, [open]);

  useEffect(() => {
    if (stayOpenOnChange && open) {
      setShouldAnimate(false);
    }
  }, [stayOpenOnChange, open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, 220);
  };

  useEffect(() => {
    if (!open) return;
    const listener = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      {!stayOpenOnChange && (
        <div
          className="fixed inset-0 z-40 bg-black/10 transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* PANEL */}
      <div
        className={`
          fixed top-0 right-0 h-full z-50 flex flex-col
          bg-white border-l border-gray-300
          shadow-lg transform transition-all
          ${shouldAnimate ? (closing ? "animate-slideOut" : "animate-slideIn") : ""}
        `}
        style={{
          width: width || "100%",
          maxWidth: width || "600px",
        }}
      >
        {/* HEADER simple */}
        <div className="relative px-5 py-4 border-b border-gray-300 bg-gray-50 sticky top-0 z-10">
          <div className="pr-10">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Bouton fermer simple */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded hover:bg-gray-200 transition-colors"
            aria-label="Fermer"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-white text-gray-800">
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {/* FOOTER simple */}
        {actions && (
          <div className="px-5 py-3 border-t border-gray-300 bg-gray-50 flex gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-slideIn { animation: slideIn 0.2s ease-out forwards; }
        .animate-slideOut { animation: slideOut 0.2s ease-in forwards; }
      `}</style>
    </>
  );
}