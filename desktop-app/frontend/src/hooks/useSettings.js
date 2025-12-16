import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPut } from "../utils/api";
import io from "socket.io-client";
import debounce from "just-debounce-it";

/**
 * useSettings - loads categories+settings, exposes helpers
 * autoSave: boolean - autosave local changes to server
 * tableId not relevant here
 */
export default function useSettings({ autoSave = true, autosaveDelay = 800, socketUrl = undefined } = {}) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cats = await apiGet("/settings");
        if (!mounted) return;
        setCategories(cats || []);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // socket realtime sync
  useEffect(() => {
    const url = socketUrl || `${location.protocol}//${location.hostname}:${location.port}`;
    const socket = io(url);
    socket.on("connect", () => {
      socket.emit("subscribe:settings", "settings");
    });
    socket.on("settings:updated", ({ key, value }) => {
      setCategories((prev) => prev.map(cat => ({ ...cat, settings: (cat.settings || []).map(s => s.key === key ? { ...s, value } : s) })));
    });
    socket.on("settings:bulkUpdated", ({ updatedKeys }) => {
      // fetch latest for simplicity
      (async () => {
        try {
          const fresh = await apiGet("/settings");
          setCategories(fresh || []);
        } catch (e) { console.error(e); }
      })();
    });
    return () => socket.disconnect();
  }, [socketUrl]);

  const findSetting = useCallback((key) => {
    for (const c of categories) {
      const s = (c.settings || []).find((x) => x.key === key);
      if (s) return s;
    }
    return null;
  }, [categories]);

  const setLocalValue = useCallback((key, value) => {
    setCategories(prev => prev.map(cat => ({ ...cat, settings: (cat.settings||[]).map(s => s.key === key ? { ...s, value: value } : s) })));
    setDirty(true);
  }, []);

  // save single setting to server
  const saveOne = useCallback(async (key) => {
    const s = findSetting(key);
    if (!s) throw new Error("Setting not found");
    const payload = { value: String(s.value ?? "") };
    const res = await apiPut(`/settings/${encodeURIComponent(key)}`, payload);
    setDirty(false);
    return res;
  }, [findSetting]);

  // bulk
  const doBulkUpdate = useCallback(async (items) => {
    const res = await apiPut("/settings/bulk", items);
    setDirty(false);
    return res;
  }, []);

  // debounced autosave
  const debounced = useMemo(() => debounce(async (items) => {
    try {
      await doBulkUpdate(items);
    } catch (e) {
      console.error("autosave error", e);
    }
  }, autosaveDelay), [doBulkUpdate, autosaveDelay]);

  useEffect(() => {
    if (!autoSave) return;
    if (!dirty) return;
    // build items from categories
    const items = [];
    categories.forEach(c => (c.settings || []).forEach(s => items.push({ key: s.key, value: String(s.value ?? "") })));
    debounced(items);
  }, [autoSave, dirty, categories, debounced]);

  return {
    loading,
    error,
    categories,
    findSetting,
    setLocalValue,
    saveOne,
    saveAll: async () => {
      const items = [];
      categories.forEach(c => (c.settings || []).forEach(s => items.push({ key: s.key, value: String(s.value ?? "") })));
      return await doBulkUpdate(items);
    },
    reload: async () => {
      setLoading(true);
      try {
        const cats = await apiGet("/settings");
        setCategories(cats || []);
      } finally { setLoading(false); }
    },
  };
}
