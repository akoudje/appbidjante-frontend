//  frontend/src/components/filters/SearchInput.jsx
import { useEffect, useState } from "react";

export default function SearchInput({ value, onChange }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local);
    }, 300);

    return () => clearTimeout(timer);
  }, [local]);

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="Recherche…"
      className="border rounded p-2 w-full md:w-64"
    />
  );
}
