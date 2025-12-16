// src/components/MobileMenuButton.jsx
export default function MobileMenuButton({ open, toggle }) {
  return (
    <button
      onClick={toggle}
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg 
               bg-card text-card-foreground border border-border shadow-lg"
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
    >
      <div className="relative w-6 h-6">
        <span className={`absolute h-0.5 w-6 bg-current transform transition duration-300 
          ${open ? 'rotate-45 top-3' : 'top-1'}`} />
        <span className={`absolute h-0.5 w-6 bg-current top-3 transform transition duration-300 
          ${open ? 'opacity-0' : 'opacity-100'}`} />
        <span className={`absolute h-0.5 w-6 bg-current transform transition duration-300 
          ${open ? '-rotate-45 top-3' : 'top-5'}`} />
      </div>
    </button>
  );
}