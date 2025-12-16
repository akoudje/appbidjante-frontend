// frontend/src/components/Photo.jsx
import { useState } from "react";

const API_BASE = "http://localhost:4000";

export default function Photo({ src, alt, className, fallbackSrc = null }) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (!src || src === "null" || src === "undefined") {
      return fallbackSrc || `${API_BASE}/uploads/default.png`;
    }
    
    if (src.startsWith("http")) {
      return src;
    }
    
    if (src.startsWith("/uploads")) {
      return `${API_BASE}${src}`;
    }
    
    if (src.startsWith("uploads/")) {
      return `${API_BASE}/${src}`;
    }
    
    return `${API_BASE}/uploads/${src.replace(/^\/?uploads\//, '')}`;
  });

  const handleError = () => {
    setImgSrc(fallbackSrc || `${API_BASE}/uploads/default.png`);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}