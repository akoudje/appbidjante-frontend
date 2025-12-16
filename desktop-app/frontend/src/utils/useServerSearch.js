// utils/useServerSearch.js
import { useEffect, useState } from "react";

export function useServerSearch(endpoint, query, page = 1, pageSize = 50) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setHasMore(false);
      return;
    }
    let mounted = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
        const json = await res.json();
        if (!mounted) return;
        setData(json.items || []);
        setHasMore(Boolean(json.hasMore));
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300); // debounce 300ms

    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [endpoint, query, page, pageSize]);

  return { data, loading, hasMore, error };
}